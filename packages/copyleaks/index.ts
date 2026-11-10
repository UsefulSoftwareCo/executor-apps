import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  record,
  router,
  secrets,
  string,
  toolAnnotations,
  boolean,
  array,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const api = "https://api.copyleaks.com";
const mcpUrl = "https://extensions.copyleaks.com/mcp";
const login = "https://id.copyleaks.com/v3/account/login/api";

type Fetch = typeof fetch;
type Credentials = { email: string; key: string };

const copyleaks = defineProvider({
  name: "Copyleaks",
  hosts: ["api.copyleaks.com", "id.copyleaks.com", "extensions.copyleaks.com", "auth.copyleaks.com"],
  auth: {
    // Created at https://api.copyleaks.com/dashboard (API Access): the account email plus its API key.
    apiKey: secrets({
      label: "Email and API key",
      fields: object({ email: string({ minLength: 1 }), key: string({ minLength: 1 }) }),
    }),
    // Official remote MCP server; OAuth 2.1 with dynamic client registration (RFC 9728 metadata).
    oauth: oauth2({ discover: mcpUrl }),
  },
  // Logging in proves the email and key; the token is not stored.
  async health(check) {
    if (check.account.method === "oauth") {
      return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } });
    }
    const { account, fetch, signal } = check;
    await token(account.fields, fetch, signal);
    return { accountInfo: { externalId: account.fields.email, displayName: account.fields.email, email: account.fields.email } };
  },
});

// Copyleaks exchanges the email and API key for a bearer token (valid 48 hours).
async function token(credentials: Credentials, fetcher: Fetch, signal: AbortSignal | undefined): Promise<string> {
  const response = await fetcher(login, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: credentials.email, key: credentials.key }),
  });
  const { access_token } = await decodeJson(response, object({ access_token: string() }));
  return access_token;
}

const ScanId = string({ minLength: 3 });
const Body = record(json());

function client(credentials: Credentials, fetcher: Fetch, signal: AbortSignal | undefined) {
  let cached: Promise<string> | undefined;
  const call = async (method: string, path: string, body?: unknown, authenticated = true): Promise<unknown> => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (authenticated) headers.Authorization = `Bearer ${await (cached ??= token(credentials, fetcher, signal))}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetcher(`${api}${path}`, {
      method,
      signal,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      throw new Error(`Copyleaks ${method} ${path} failed with ${response.status}: ${(await response.text()).slice(0, 500)}`);
    }
    const text = await response.text();
    if (text === "") return { ok: true, status: response.status };
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { text };
    }
  };

  const path = (strings: TemplateStringsArray, ...ids: string[]) =>
    strings.reduce((out, part, i) => out + part + (i < ids.length ? encodeURIComponent(ids[i]!) : ""), "");

  const get = (description: string, url: string, authenticated = true) =>
    query({ description, input: object({}) }, async () => call("GET", url, undefined, authenticated) as Promise<never>);

  return router({
    account: router(
      {
        credits: get("Get the remaining credit balance of the scans account (one credit scans up to 250 words).", "/v3/scans/credits"),
        aiDetectionCredits: get("Get the credits available to the AI text detection wallet.", "/v2/writer-detector/credits"),
        usageHistory: query(
          {
            description: "Export usage history between two dates (dd-MM-yyyy). Returns the CSV as text.",
            input: object({ start: string(), end: string() }),
          },
          async (_ctx, { start, end }) =>
            call("GET", `/v3/scans/usages/history?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`) as Promise<never>,
        ),
        repositoryInfo: query(
          {
            description: "Get a Private Cloud Hub repository's credit consumption, metadata values and status.",
            input: object({ repositoryId: string() }),
          },
          async (_ctx, { repositoryId }) => call("GET", path`/v3/repositories/repository/${repositoryId}/info`) as Promise<never>,
        ),
      },
      { title: "Account", description: "Credit balances, usage history and repositories." },
    ),
    reference: router(
      {
        ocrLanguages: get("List languages the OCR engine supports.", "/v3/miscellaneous/ocr-languages-list", false),
        crossLanguages: get("List source and target languages supported for cross-language plagiarism detection.", "/v3/miscellaneous/allowed-cross-languages", false),
        plagiarismFileTypes: get("List file formats accepted for plagiarism scans.", "/v3/miscellaneous/supported-plagiarism-file-types", false),
        aiTextFileTypes: get("List file formats accepted for AI text detection.", "/v3/miscellaneous/supported-ai-text-detection-file-types", false),
        correctionTypes: query(
          {
            description: "List the correction types the Grammar Checker returns, with texts in the given ISO 639-1 language (en).",
            input: object({ languageCode: string().default("en") }),
          },
          async (_ctx, { languageCode }) => call("GET", path`/v1/writing-feedback/correction-types/${languageCode}`, undefined, false) as Promise<never>,
        ),
      },
      { title: "Reference", description: "Supported languages, file types and correction types." },
    ),
    detection: router(
      {
        aiText: mutation(
          {
            description:
              "Classify text (255 to 100000 characters) as human or AI-written. Consumes credits unless sandbox is true.",
            input: object({
              scanId: ScanId,
              text: string({ minLength: 255 }),
              sandbox: boolean().default(false),
              language: string().optional(),
              explain: boolean().default(false),
              sensitivity: number().default(2),
            }),
          },
          async (_ctx, { scanId, ...body }) => call("POST", path`/v2/writer-detector/${scanId}/check`, body) as Promise<never>,
        ),
        moderateText: mutation(
          {
            description:
              "Flag harmful content in text (1 to 25000 characters). labels is a list of label ids such as toxic-v1, profanity-v1, hate-speech-v1.",
            input: object({
              scanId: ScanId,
              text: string({ minLength: 1 }),
              sandbox: boolean().default(false),
              language: string().optional(),
              labels: array(string()).optional(),
            }),
          },
          async (_ctx, { scanId, labels, ...rest }) =>
            call("POST", path`/v1/text-moderation/${scanId}/check`, {
              ...rest,
              ...(labels === undefined ? {} : { labels: labels.map((id) => ({ id })) }),
            }) as Promise<never>,
        ),
        grammar: mutation(
          {
            description: "Get grammar, spelling and sentence corrections for text (1 to 25000 characters).",
            input: object({
              scanId: ScanId,
              text: string({ minLength: 1 }),
              sandbox: boolean().default(false),
              language: string().optional(),
              score: Body.optional(),
            }),
          },
          async (_ctx, { scanId, ...body }) => call("POST", path`/v1/writing-feedback/${scanId}/check`, body) as Promise<never>,
        ),
        aiImageAsync: mutation(
          {
            description:
              "Submit an image URL for AI-generated image detection. The result is delivered to the webhook in body. Pass the JSON request body from the Copyleaks docs as body.",
            input: object({ scanId: ScanId, body: Body }),
          },
          async (_ctx, { scanId, body }) => call("PUT", path`/v1/ai-image-detector-async/${scanId}/submit`, body) as Promise<never>,
        ),
        aiVideo: mutation(
          {
            description:
              "Submit a video URL for AI-generated content detection. The result is delivered to the webhook in body. Pass the JSON request body from the Copyleaks docs as body.",
            input: object({ scanId: ScanId, body: Body }),
          },
          async (_ctx, { scanId, body }) => call("POST", path`/v1/ai-video-detector/${scanId}/submit`, body) as Promise<never>,
        ),
      },
      { title: "Detection", description: "AI text, moderation and grammar checks, plus async AI image and video detection." },
    ),
    scans: router(
      {
        submitUrl: mutation(
          {
            description:
              "Submit a URL for a plagiarism, AI content and writing scan. properties must include webhooks.status (a URL containing {STATUS}); set properties.sandbox to true to avoid credits.",
            input: object({
              scanId: ScanId,
              url: string(),
              verb: string().optional(),
              headers: array(array(string())).optional(),
              properties: Body,
            }),
          },
          async (_ctx, { scanId, ...body }) => call("PUT", path`/v3/scans/submit/url/${scanId}`, body) as Promise<never>,
        ),
        submitFile: mutation(
          {
            description:
              "Submit a file for a plagiarism, AI content and writing scan. base64 is the file content, filename its name; properties as for submitUrl.",
            input: object({ scanId: ScanId, base64: string(), filename: string(), properties: Body }),
          },
          async (_ctx, { scanId, ...body }) => call("PUT", path`/v3/scans/submit/file/${scanId}`, body) as Promise<never>,
        ),
        submitOcr: mutation(
          {
            description:
              "Submit an image with text for OCR and a plagiarism scan. base64 is the image content, filename its name, langCode its language; properties as for submitUrl.",
            input: object({ scanId: ScanId, base64: string(), filename: string(), langCode: string(), properties: Body }),
          },
          async (_ctx, { scanId, ...body }) => call("PUT", path`/v3/scans/submit/ocr/${scanId}`, body) as Promise<never>,
        ),
        start: mutation(
          {
            description: "Start full scans for submissions that were price-checked (up to 100). errorHandling: 0 cancels on error, 1 ignores.",
            input: object({ trigger: array(string()), errorHandling: number().default(0) }),
          },
          async (_ctx, body) => call("PATCH", "/v3/scans/start", body) as Promise<never>,
        ),
        delete: mutation(
          {
            description: "Delete completed scans (up to 10000). purge removes every trace, including shared and private hubs.",
            input: object({ ids: array(string()), purge: boolean().default(false), completionWebhook: string().optional() }),
          },
          async (_ctx, { ids, purge, completionWebhook }) =>
            call("PATCH", "/v3.1/scans/delete", {
              scans: ids.map((id) => ({ id })),
              purge,
              ...(completionWebhook === undefined ? {} : { completionWebhook }),
            }) as Promise<never>,
        ),
        resendWebhook: mutation(
          {
            description: "Resend the webhooks of an existing scan.",
            input: object({ scanId: ScanId }),
          },
          async (_ctx, { scanId }) => call("POST", path`/v3/scans/${scanId}/webhooks/resend`) as Promise<never>,
        ),
        export: mutation(
          {
            description:
              "Export a scan's raw results and push them to your servers. Pass the export configuration (results, pdfReport, crawledVersion, completionWebhook) as body.",
            input: object({ scanId: ScanId, exportId: ScanId, body: Body }),
          },
          async (_ctx, { scanId, exportId, body }) => call("POST", path`/v3/downloads/${scanId}/export/${exportId}`, body) as Promise<never>,
        ),
      },
      {
        title: "Scans",
        description: "Submit documents, URLs and images for plagiarism and AI scans, start, export and delete them.",
        instructions:
          "Scan results arrive by webhook, not in the response. Use properties.sandbox: true while testing: sandbox scans cost no credits.",
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { copyleaks: copyleaks.many() } }, icons },
  async ({ user, cache, signal, fetch }) => ({
    tools: router(
      {
        // Scan results, history, profiles and balance through Copyleaks' official MCP server.
        mcp: await accountRouter(
          (user?.accounts.copyleaks ?? []).filter((account) => account.method === "oauth"),
          async (account) =>
            withApprovals(
              await mcpRouter({
                url: mcpUrl,
                account,
                headers: { Authorization: `Bearer ${account.fields.access_token}` },
                cache,
                signal,
              }),
              (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
            ),
          { signal },
        ),
        rest: await accountRouter(
          (user?.accounts.copyleaks ?? []).filter((account) => account.method === "apiKey"),
          (account) =>
            withApprovals(client(account.fields, fetch, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
          { signal },
        ),
      },
      {
        title: "Copyleaks",
        description:
          "Plagiarism and AI content detection, grammar checking and text moderation with Copyleaks. mcp: official MCP server (OAuth; read scan results, history, profiles, balance). rest: REST API tools (email and API key).",
        icons,
      },
    ),
  }),
);
