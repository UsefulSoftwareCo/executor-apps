import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const regions = {
  us: "https://llmwhisperer-api.us-central.unstract.com/api/v2",
  eu: "https://llmwhisperer-api.eu-west.unstract.com/api/v2",
};

type Account = { fields: { token: string; region: string } };

// The region field is "us" or "eu"; anything else is rejected rather than silently defaulted.
const base = (account: Account) => {
  const url = regions[account.fields.region.toLowerCase() as keyof typeof regions];
  if (url === undefined) throw new Error('LLMWhisperer region must be "us" or "eu"');
  return url;
};

const headers = (account: Account) => ({ "unstract-key": account.fields.token, Accept: "application/json" });

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const llmwhisperer = defineProvider({
  name: "LLMWhisperer",
  hosts: ["llmwhisperer-api.us-central.unstract.com", "llmwhisperer-api.eu-west.unstract.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }), region: string({ minLength: 2 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base(account)}/get-usage-info`, { signal, headers: headers(account) });
    await decodeJson(response, object({ subscription_plan: string() }));
  },
});

const whisperHash = object({ whisperHash: string() });

const tools = (account: Account, signal: AbortSignal) =>
  router({
    whisper: mutation(
      {
        description:
          "Start an asynchronous extraction job that converts a document to LLM-ready text. Give either url (a public document URL that needs no authentication) or contentBase64 (the file bytes, base64-encoded). Returns whisper_hash; poll status until it is processed, then call retrieve (the text can be retrieved only once). mode is native_text, low_cost, high_quality, form (default) or table. outputMode is layout_preserving (default) or text. pagesToExtract is like 1-5,7,21-. Set addLineNos to store line metadata for highlights. useWebhook names a webhook registered with createWebhook. Consumes page quota.",
        input: object({
          url: string().optional(),
          contentBase64: string().optional(),
          mode: string().optional(),
          outputMode: string().optional(),
          pageSeparator: string().optional(),
          pagesToExtract: string().optional(),
          medianFilterSize: number().optional(),
          gaussianBlurRadius: number().optional(),
          lineSplitterTolerance: number().optional(),
          horizontalStretchFactor: number().optional(),
          markVerticalLines: boolean().optional(),
          markHorizontalLines: boolean().optional(),
          tag: string().optional(),
          fileName: string().optional(),
          useWebhook: string().optional(),
          webhookMetadata: string().optional(),
          addLineNos: boolean().optional(),
          allowRotatedText: boolean().optional(),
          wordConfidenceThreshold: number().optional(),
          includeLineConfidence: boolean().optional(),
          watermarkAngleThreshold: number().optional(),
          checkboxConfidenceThreshold: number().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => {
        const { url, contentBase64, ...rest } = input;
        if ((url === undefined) === (contentBase64 === undefined)) {
          throw new Error("Provide exactly one of url or contentBase64");
        }
        const params = search({
          mode: rest.mode,
          output_mode: rest.outputMode,
          page_separator: rest.pageSeparator,
          pages_to_extract: rest.pagesToExtract,
          median_filter_size: rest.medianFilterSize,
          gaussian_blur_radius: rest.gaussianBlurRadius,
          line_splitter_tolerance: rest.lineSplitterTolerance,
          horizontal_stretch_factor: rest.horizontalStretchFactor,
          mark_vertical_lines: rest.markVerticalLines,
          mark_horizontal_lines: rest.markHorizontalLines,
          tag: rest.tag,
          file_name: rest.fileName,
          use_webhook: rest.useWebhook,
          webhook_metadata: rest.webhookMetadata,
          add_line_nos: rest.addLineNos,
          allow_rotated_text: rest.allowRotatedText,
          word_confidence_threshold: rest.wordConfidenceThreshold,
          include_line_confidence: rest.includeLineConfidence,
          watermark_angle_threshold: rest.watermarkAngleThreshold,
          checkbox_confidence_threshold: rest.checkboxConfidenceThreshold,
          url_in_post: url !== undefined ? true : undefined,
        });
        const body =
          url !== undefined ? url : Uint8Array.from(atob(contentBase64 as string), (c) => c.charCodeAt(0));
        return decodeJson(
          await fetch(`${base(account)}/whisper?${params}`, {
            method: "POST",
            signal,
            headers: {
              ...headers(account),
              "content-type": url !== undefined ? "text/plain" : "application/octet-stream",
            },
            body,
          }),
          json(),
        );
      },
    ),
    status: query(
      {
        description:
          "Check an extraction job. Returns status (accepted, processing, processed, error or retrieved), a message and per-page details.",
        input: whisperHash,
      },
      async ({ fetch }, { whisperHash }) =>
        decodeJson(
          await fetch(`${base(account)}/whisper-status?${search({ whisper_hash: whisperHash })}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    retrieve: mutation(
      {
        description:
          "Fetch the extracted text of a processed job. The text can be retrieved only once (later calls fail with Whisper already delivered), so keep the result. Returns result_text plus confidence_metadata and metadata, or only the text when textOnly is true.",
        input: object({ whisperHash: string(), textOnly: boolean().optional() }),
        approval: always(),
      },
      async ({ fetch }, { whisperHash, textOnly }) =>
        decodeJson(
          await fetch(`${base(account)}/whisper-retrieve?${search({ whisper_hash: whisperHash, text_only: textOnly })}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    details: query(
      {
        description:
          "Get details of an extraction job: mode, tag, total, requested and processed pages, file size, start and completion times and processing time.",
        input: whisperHash,
      },
      async ({ fetch }, { whisperHash }) =>
        decodeJson(
          await fetch(`${base(account)}/whisper-detail?${search({ whisper_hash: whisperHash })}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    highlights: query(
      {
        description:
          "Get line position metadata (page, base_y, height, as values and percentages) for highlighting extracted lines. The job must have been started with addLineNos. lines is like 1-5,7,21-.",
        input: object({ whisperHash: string(), lines: string() }),
      },
      async ({ fetch }, { whisperHash, lines }) =>
        decodeJson(
          await fetch(`${base(account)}/highlights?${search({ whisper_hash: whisperHash, lines })}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    usageInfo: query(
      {
        description:
          "Get account usage: subscription plan, monthly and daily quota, and page counts (total, today, overage, and per mode on paid plans). A value of -1 means no quota.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(await fetch(`${base(account)}/get-usage-info`, { signal, headers: headers(account) }), json()),
    ),
    usageByTag: query(
      {
        description:
          "Get pages processed per mode for one tag. fromDate and toDate are YYYY-MM-DD; both default to the last 30 days.",
        input: object({ tag: string(), fromDate: string().optional(), toDate: string().optional() }),
      },
      async ({ fetch }, { tag, fromDate, toDate }) =>
        decodeJson(
          await fetch(`${base(account)}/usage?${search({ tag, from_date: fromDate, to_date: toDate })}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    getWebhook: query(
      {
        description: "Get a registered webhook by name: url, auth_token and webhook_name.",
        input: object({ webhookName: string() }),
      },
      async ({ fetch }, { webhookName }) =>
        decodeJson(
          await fetch(`${base(account)}/whisper-manage-callback?${search({ webhook_name: webhookName })}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    createWebhook: mutation(
      {
        description:
          "Register a webhook called when an extraction finishes. LLMWhisperer first sends a test payload and the URL must answer 200 or registration fails. authToken is sent as a bearer token; use an empty string for none.",
        input: object({ webhookName: string(), url: string(), authToken: string() }),
        approval: always(),
      },
      async ({ fetch }, { webhookName, url, authToken }) =>
        decodeJson(
          await fetch(`${base(account)}/whisper-manage-callback`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify({ webhook_name: webhookName, url, auth_token: authToken }),
          }),
          json(),
        ),
    ),
    updateWebhook: mutation(
      {
        description: "Update the url and auth token of an existing webhook, identified by its name.",
        input: object({ webhookName: string(), url: string(), authToken: string() }),
        approval: always(),
      },
      async ({ fetch }, { webhookName, url, authToken }) =>
        decodeJson(
          await fetch(`${base(account)}/whisper-manage-callback`, {
            method: "PUT",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify({ webhook_name: webhookName, url, auth_token: authToken }),
          }),
          json(),
        ),
    ),
    deleteWebhook: mutation(
      {
        description: "Delete a registered webhook by name.",
        input: object({ webhookName: string() }),
        approval: always(),
      },
      async ({ fetch }, { webhookName }) =>
        decodeJson(
          await fetch(`${base(account)}/whisper-manage-callback?${search({ webhook_name: webhookName })}`, {
            method: "DELETE",
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { llmwhisperer: llmwhisperer.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.llmwhisperer ?? [], (account) => tools(account, signal), { signal }), {
    title: "LLMWhisperer",
    description:
      "Convert PDFs, scans, images and Office files to layout-preserving, LLM-ready text with LLMWhisperer: start extraction jobs, poll status, retrieve text, highlights, usage and webhooks.",
    icons,
  }),
}));
