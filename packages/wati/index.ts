import {
  accountRouter,
  array,
  defineApp,
  defineProvider,
  json,
  decodeJson,
  mutation,
  number,
  oauth2,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every Wati account has its own API endpoint, shown on the API Docs page:
// https://live-mt-server.wati.io/<tenantId> or https://live-server-<id>.wati.io.
function originFor(raw: string): string {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`);
  } catch {
    throw new Error("Enter the API endpoint from Wati's API Docs page, e.g. https://live-mt-server.wati.io/12345.");
  }
  if (url.protocol !== "https:" || !(url.hostname === "wati.io" || url.hostname.endsWith(".wati.io")))
    throw new Error("The Wati API endpoint must be an https://*.wati.io URL.");
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

const wati = defineProvider({
  name: "Wati",
  hosts: ["*.wati.io"],
  auth: {
    // The access token is on Wati's API Docs page (Dashboard > API Docs); it is sent as a bearer token.
    apiKey: secrets({
      label: "Access token",
      fields: object({
        endpoint: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${originFor(account.fields.endpoint)}/api/v1/getContacts?pageSize=1&pageNumber=1`, {
      signal,
      headers: { Authorization: bearer(account.fields.token), Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Wati rejected the access token (HTTP ${response.status}).`);
  },
});

const bearer = (token: string) => (/^bearer /i.test(token.trim()) ? token.trim() : `Bearer ${token.trim()}`);

type Account = { fields: { endpoint: string; token: string } };

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const param = object({ name: string(), value: string() });
const number_ = string();
const numberDoc = "whatsappNumber is the contact's number with country code, digits only (for example 85264318721).";
const channelDoc = "channelPhoneNumber selects the sending channel number when the account has several.";

const watiTools = (account: Account, signal: AbortSignal) => {
  const origin = originFor(account.fields.endpoint);
  const headers = { Authorization: bearer(account.fields.token), Accept: "application/json" };
  const get = (fetch: typeof globalThis.fetch, path: string, params: Record<string, string | number | undefined> = {}) =>
    fetch(`${origin}${path}${search(params)}`, { signal, headers });
  const post = (fetch: typeof globalThis.fetch, path: string, params: Record<string, string | number | undefined>, body?: unknown) =>
    fetch(`${origin}${path}${search(params)}`, {
      method: "POST",
      signal,
      headers: body === undefined ? headers : { ...headers, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const enc = encodeURIComponent;

  return router({
    getContacts: query(
      {
        description:
          "List contacts, paged with pageSize and pageNumber (from 1). Optional filters: name, createdDate (YYYY-MM-DD) and attribute, a JSON array of {name, operator, value} where operator is contain, notContain, exist, notExist, ==, !=, valid or invalid.",
        input: object({
          pageSize: number().optional(),
          pageNumber: number().optional(),
          name: string().optional(),
          attribute: string().optional(),
          createdDate: string().optional(),
        }),
      },
      async ({ fetch }, input) => decodeJson(await get(fetch, "/api/v1/getContacts", input), json()),
    ),
    addContact: mutation(
      {
        description: `Add a contact with a name and optional custom parameters. ${numberDoc}`,
        input: object({ whatsappNumber: string(), name: string().optional(), customParams: array(param).optional() }),
        approval: always(),
      },
      async ({ fetch }, { whatsappNumber, ...body }) =>
        decodeJson(await post(fetch, `/api/v1/addContact/${enc(whatsappNumber)}`, {}, body), json()),
    ),
    updateContactAttributes: mutation(
      {
        description: `Set custom parameters (name/value pairs) on an existing contact. ${numberDoc}`,
        input: object({ whatsappNumber: string(), customParams: array(param) }),
        approval: always(),
      },
      async ({ fetch }, { whatsappNumber, ...body }) =>
        decodeJson(await post(fetch, `/api/v1/updateContactAttributes/${enc(whatsappNumber)}`, {}, body), json()),
    ),
    getMessages: query(
      {
        description: `List the conversation messages with one contact, paged with pageSize and pageNumber (from 1). ${numberDoc} ${channelDoc} Rate limit: 10 requests per 10 seconds; prefer webhooks for incoming messages.`,
        input: object({
          whatsappNumber: string(),
          pageSize: number().optional(),
          pageNumber: number().optional(),
          channelPhoneNumber: string().optional(),
        }),
      },
      async ({ fetch }, { whatsappNumber, ...rest }) =>
        decodeJson(await get(fetch, `/api/v1/getMessages/${enc(whatsappNumber)}`, rest), json()),
    ),
    sendSessionMessage: mutation(
      {
        description: `Send a free-form text message inside the open 24-hour conversation window (the contact must have messaged recently). messageText is up to 4096 characters; replyContextId is the wamid of a message to reply to. ${numberDoc} ${channelDoc}`,
        input: object({
          whatsappNumber: string(),
          messageText: string(),
          replyContextId: string().optional(),
          channelPhoneNumber: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { whatsappNumber, ...rest }) =>
        decodeJson(await post(fetch, `/api/v1/sendSessionMessage/${enc(whatsappNumber)}`, rest), json()),
    ),
    sendSessionFile: mutation(
      {
        description: `Send a file inside the open 24-hour window. Provide the file as base64 in contentBase64 with its fileName and mimeType; caption is optional. ${numberDoc}`,
        input: object({
          whatsappNumber: string(),
          fileName: string(),
          mimeType: string(),
          contentBase64: string(),
          caption: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { whatsappNumber, fileName, mimeType, contentBase64, caption }) => {
        const form = new FormData();
        form.set("file", new Blob([Buffer.from(contentBase64, "base64")], { type: mimeType }), fileName);
        return decodeJson(
          await fetch(`${origin}/api/v1/sendSessionFile/${enc(whatsappNumber)}${search({ caption })}`, {
            method: "POST",
            signal,
            headers,
            body: form,
          }),
          json(),
        );
      },
    ),
    getMessageTemplates: query(
      {
        description: "List WhatsApp message templates and their approval status, paged with pageSize and pageNumber (from 1).",
        input: object({ pageSize: number().optional(), pageNumber: number().optional() }),
      },
      async ({ fetch }, input) => decodeJson(await get(fetch, "/api/v1/getMessageTemplates", input), json()),
    ),
    sendTemplateMessage: mutation(
      {
        description: `Send an approved template message to one contact (works outside the 24-hour window). parameters fill the template variables by name. The v2 endpoint is used and returns a localMessageId per receiver. ${numberDoc} ${channelDoc}`,
        input: object({
          whatsappNumber: string(),
          template_name: string(),
          broadcast_name: string(),
          parameters: array(param).optional(),
          channel_number: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { whatsappNumber, ...body }) =>
        decodeJson(await post(fetch, "/api/v2/sendTemplateMessage", { whatsappNumber }, body), json()),
    ),
    sendTemplateMessages: mutation(
      {
        description:
          "Send an approved template message to many contacts. Each receiver has a whatsappNumber and customParams (name/value pairs) for the template variables. Uses the v2 endpoint.",
        input: object({
          template_name: string(),
          broadcast_name: string(),
          receivers: array(object({ whatsappNumber: string(), customParams: array(param).optional() })),
          channel_number: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, body) => decodeJson(await post(fetch, "/api/v2/sendTemplateMessages", {}, body), json()),
    ),
    sendInteractiveButtonsMessage: mutation(
      {
        description: `Send a message with up to 3 quick-reply buttons inside the 24-hour window. header is {type: "Text", text}; body is required; footer is optional. WhatsApp enforces character limits. ${numberDoc}`,
        input: object({
          whatsappNumber: string(),
          body: string(),
          buttons: array(object({ text: string() })),
          header: object({ type: string(), text: string() }).optional(),
          footer: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { whatsappNumber, ...body }) =>
        decodeJson(await post(fetch, "/api/v1/sendInteractiveButtonsMessage", { whatsappNumber }, body), json()),
    ),
    sendInteractiveListMessage: mutation(
      {
        description: `Send a list message with a menu button inside the 24-hour window. sections hold rows of {title, description}; buttonText labels the menu button. ${numberDoc}`,
        input: object({
          whatsappNumber: string(),
          body: string(),
          buttonText: string(),
          sections: array(
            object({ title: string(), rows: array(object({ title: string(), description: string().optional() })) }),
          ),
          header: string().optional(),
          footer: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { whatsappNumber, ...body }) =>
        decodeJson(await post(fetch, "/api/v1/sendInteractiveListMessage", { whatsappNumber }, body), json()),
    ),
    assignOperator: mutation(
      {
        description: `Assign a conversation to an operator (team member) by their email. ${numberDoc}`,
        input: object({ whatsappNumber: string(), email: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => decodeJson(await post(fetch, "/api/v1/assignOperator", input), json()),
    ),
    getMedia: query(
      {
        description:
          "Download a media file received in a conversation by its fileName (as returned in message data). Returns the response as JSON when it is JSON, otherwise the HTTP status and content type.",
        input: object({ fileName: string() }),
      },
      async ({ fetch }, input) => {
        const response = await get(fetch, "/api/v1/getMedia", input);
        const type = response.headers.get("content-type") ?? "";
        if (type.includes("json")) return decodeJson(response, json());
        return { status: response.status, contentType: type, bytes: (await response.arrayBuffer()).byteLength };
      },
    ),
  });
};

const mcpUrls = { oauth: "https://mcp.wati.io/mcp", oauthEu: "https://eu-mcp.wati.io/mcp" } as const;

// Wati's official remote MCP server (docs.wati.io/reference/mcp). Each region has its own host and
// OAuth metadata (RFC 8414 at /.well-known/oauth-authorization-server); pick the one for your workspace.
const watiMcp = defineProvider({
  name: "Wati MCP",
  hosts: ["mcp.wati.io", "eu-mcp.wati.io"],
  auth: {
    oauth: oauth2({ discover: mcpUrls.oauth }),
    oauthEu: oauth2({ discover: mcpUrls.oauthEu }),
  },
  health: (check) =>
    mcpHealth(check, {
      url: mcpUrls[check.account.method],
      headers: { Authorization: `Bearer ${check.account.fields.access_token}` },
    }),
});

export default defineApp(
  { user: { accounts: { wati: wati.many(), watiMcp: watiMcp.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      {
        mcp: router(
          await accountRouter(
            user?.accounts.watiMcp ?? [],
            async (account) =>
              withApprovals(
                await mcpRouter({
                  url: mcpUrls[account.method],
                  account,
                  headers: { Authorization: `Bearer ${account.fields.access_token}` },
                  signal,
                }),
                (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
              ),
            { signal },
          ),
          {
            title: "Wati MCP",
            description:
              "Wati's official MCP server: workspaces, contacts, conversations, templates, campaigns, segments, channels and webhooks. Sign in with OAuth; choose the Global or EU connection to match your workspace region.",
          },
        ),
        api: router(await accountRouter(user?.accounts.wati ?? [], (account) => watiTools(account, signal), { signal }), {
          title: "Wati API (access token)",
          description:
            "Hand-written tools over Wati's legacy v1/v2 REST API: contacts, session messages and files, template and interactive messages, operator assignment and media.",
          instructions:
            "Enter the API endpoint shown on Wati's API Docs page (for example https://live-mt-server.wati.io/12345) and its access token. Phone numbers take the country code with no + or spaces. Free-form session messages only work within 24 hours of the contact's last message; use template messages otherwise.",
        }),
      },
      {
        title: "Wati",
        description:
          "Wati WhatsApp Business: the official MCP server (OAuth) and hand-written legacy API tools (access token).",
        icons,
      },
    ),
  }),
);
