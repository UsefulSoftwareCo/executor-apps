import {
  accountRouter,
  array,
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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://castingwords.com/store/API4";

const castingwords = defineProvider({
  name: "CastingWords",
  hosts: ["castingwords.com"],
  auth: {
    // CastingWords has no OAuth; the key is shown at https://castingwords.com/customer/info.
    apiKey: secrets({
      label: "API key",
      fields: object({ key: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/prepay_balance?api_key=${encodeURIComponent(account.fields.key)}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

const Id = string({ minLength: 1 });
// The schema facade has no enum/union, so the documented set is enforced before any request is made.
const EXTENSIONS = ["txt", "doc", "docx", "rtf", "html", "srt", "tstxt", "vtt"] as const;
const Extension = string().default("txt");
const WebhookEvent = string();
const Test = number().optional();

function build(key: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const get = async (path: string, search: Params = {}) => {
    const url = new URL(`${base}/${path}`);
    url.searchParams.set("api_key", key);
    for (const [k, v] of Object.entries(search)) if (v !== undefined) url.searchParams.set(k, String(v));
    const response = await fetcher(url.toString(), { signal, headers: { Accept: "application/json" } });
    return decodeJson(response, json());
  };
  // The documented POST format is URL-encoded key/value pairs with repeated keys for multi-value params
  // (sku=TRANS14&sku=TSTMP1). JSON arrays for url/sku are undocumented, so arrays are sent as repeated keys.
  const post = async (path: string, body: Params = {}) => {
    const form = new URLSearchParams();
    form.append("api_key", key);
    for (const [k, v] of Object.entries(body)) {
      if (v === undefined) continue;
      for (const item of Array.isArray(v) ? v : [v]) form.append(k, String(item));
    }
    const response = await fetcher(`${base}/${path}`, {
      method: "POST",
      signal,
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    return decodeJson(response, json());
  };
  const flag = (test: number | undefined) => (test ? "1" : undefined);
  const enc = encodeURIComponent;

  return router({
    orders: router({
      create: mutation(
        {
          description:
            "Order a human transcript for one or more public audio/video URLs (POST /order_url). Every SKU applies to every URL. Returns the order id and audiofile ids; a `hold` key of \"billing\" means the order is accepted but on hold. Use test=1 for a non-transcribed test order.",
          input: object({
            url: array(string({ minLength: 1 })),
            sku: array(string({ minLength: 1 })),
            names: array(string()).optional(),
            notes: string().optional(),
            test: Test,
          }),
        },
        async (_ctx, i) =>
          post("order_url", { url: i.url, sku: i.sku, name: i.names, notes: i.notes, test: flag(i.test) }),
      ),
    }),
    audiofiles: router({
      get: query(
        {
          description:
            "Get an audiofile's state (statename), title, duration in minutes, speaker names, notes, original link and quality stars.",
          input: object({ audiofileId: Id }),
        },
        async (_ctx, i) => get(`audiofile/${enc(i.audiofileId)}`),
      ),
      getTranscript: query(
        {
          description:
            "Fetch a finished transcript. extension is one of txt (default), doc, docx, rtf, html, srt, tstxt, vtt. Binary formats (doc, docx, rtf) may not be readable; prefer txt, html, srt or vtt. test=1 returns a fake transcript.",
          input: object({ audiofileId: Id, extension: Extension, test: Test }),
        },
        async (_ctx, i) => {
          if (!(EXTENSIONS as readonly string[]).includes(i.extension))
            throw new Error(`Unsupported transcript extension. Use one of: ${EXTENSIONS.join(", ")}`);
          const url = new URL(`${base}/audiofile/${enc(i.audiofileId)}/transcript.${enc(i.extension)}`);
          url.searchParams.set("api_key", key);
          if (i.test) url.searchParams.set("test", "1");
          const response = await fetcher(url.toString(), { signal });
          if (!response.ok) throw new Error(`CastingWords transcript request failed (${response.status})`);
          return { extension: i.extension, contentType: response.headers.get("content-type") ?? "", content: await response.text() };
        },
      ),
      upgrade: mutation(
        {
          description:
            "Order upgrades on an audiofile. SKUs: DIFFQ2 difficult audio, TSTMP1 timestamps, CAPTION1 captions, EDIT01 extra editing, UPGRD1 TRANS14 to TRANS6, UPGRD2 TRANS14 to TRANS2, UPGRD3 TRANS6 to TRANS2. test=1 only works for audiofiles 100 and 101.",
          input: object({ audiofileId: Id, sku: array(string({ minLength: 1 })), test: Test }),
        },
        async (_ctx, i) => post(`audiofile/${enc(i.audiofileId)}/upgrade`, { sku: i.sku, test: flag(i.test) }),
      ),
      refund: mutation(
        {
          description:
            "Cancel and refund an audiofile. Only works before transcription work has started (e.g. Pre-Processing, Audio Processing, Error). test=1 only works for audiofiles 100 and 101.",
          input: object({ audiofileId: Id, test: Test }),
        },
        async (_ctx, i) => post(`audiofile/${enc(i.audiofileId)}/refund`, { test: flag(i.test) }),
      ),
    }),
    account: router({
      getPrepayBalance: query(
        { description: "Get the current prepay balance in USD.", input: object({}) },
        async () => get("prepay_balance"),
      ),
      getInvoice: query(
        {
          description: "Get an invoice (GET /invoice/ID; the vendor docs list POST in the overview but GET in the detail section, so GET is used): id, purchase order, create and paid times, total, state (PAID, SUBMITTED, OPEN, CREATED) and line items.",
          input: object({ invoiceId: Id }),
        },
        async (_ctx, i) => get(`invoice/${enc(i.invoiceId)}`),
      ),
    }),
    webhooks: router({
      get: query(
        { description: "Get the webhook URL registered for the account.", input: object({}) },
        async () => get("webhook"),
      ),
      set: mutation(
        {
          description:
            "Register the http(s) URL that receives CastingWords events (TRANSCRIPT_COMPLETE, DUPLICATE_FILE, REFUND_ISSUED, CC_AUTH_FAILURE, DIFFICULT_AUDIO, ORDER_ON_HOLD). Returns the current URL.",
          input: object({ webhook: string({ minLength: 1 }) }),
        },
        async (_ctx, i) => post("webhook", { webhook: i.webhook }),
      ),
      test: mutation(
        {
          description:
            "Ask CastingWords to send a test event to the registered webhook. event is TRANSCRIPT_COMPLETE, DIFFICULT_AUDIO, REFUND_ISSUED or ORDER_ON_HOLD.",
          input: object({ event: WebhookEvent }),
        },
        async (_ctx, i) => post(`webhook/test/${enc(i.event)}`),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { castingwords: castingwords.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.castingwords ?? [],
        (account) =>
          withApprovals(build(account.fields.key, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "CastingWords",
        description: "Order and manage human transcripts with CastingWords: orders, audiofiles, transcripts, upgrades, refunds, invoices, balance and webhooks.",
        instructions:
          "Orders cost money: confirm SKUs first (TRANS14 budget, TRANS6 six day, TRANS2 one day, EMSR02 machine; add-ons DIFFQ2, TSTMP1, CAPTION1, VERBATIM1) and use test=1 to dry run. Media URLs must be public. Poll audiofiles.get until statename is Delivered, then audiofiles.getTranscript.",
        icons,
      },
    ),
  }),
);
