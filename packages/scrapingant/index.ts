import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
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

const api = "https://api.scrapingant.com/v2";

const scrapingant = defineProvider({
  name: "ScrapingAnt",
  hosts: ["api.scrapingant.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The usage endpoint is read-only and costs no credits.
  async health({ account, fetch, signal }) {
    const response = await fetch(buildUrl("/usage", {}, account.fields.token), { signal });
    await decodeJson(response, object({ plan_name: string() }));
  },
});

type Account = { fields: { token: string } };
type Fetch = typeof fetch;

const resources = [
  "document",
  "stylesheet",
  "image",
  "media",
  "font",
  "script",
  "texttrack",
  "xhr",
  "fetch",
  "eventsource",
  "websocket",
  "manifest",
  "other",
];

// Options shared by every scraping endpoint. js_snippet is deliberately absent: it runs code on the target page.
const common = () => ({
  url: string({ minLength: 1 }),
  browser: boolean().optional(),
  timeout: number().optional(),
  proxy_type: string().optional(),
  proxy_country: string().optional(),
  cookies: string().optional(),
  wait_for_selector: string().optional(),
  block_resource: array(string()).optional(),
  return_page_source: boolean().optional(),
});

const commonNotes =
  "browser defaults to true (headless Chrome, 10 credits on datacenter proxies; browser=false costs 1). proxy_type is datacenter (default) or residential (25 credits without browser, 125 with). timeout is 5-60 seconds. wait_for_selector, block_resource (any of " +
  resources.join(", ") +
  ") and return_page_source need browser=true.";

// ScrapingAnt takes the key as the required `x-api-key` query parameter on every endpoint, not as a header.
function buildUrl(path: string, params: Record<string, unknown>, token: string): string {
  const url = new URL(`${api}${path}`);
  url.searchParams.set("x-api-key", token);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
    else url.searchParams.set(key, String(value));
  }
  return url.toString();
}

// Chunked so large snippets do not overflow the argument limit of String.fromCharCode.
function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

// A body that is not JSON (the general endpoint returns the target page) comes back as text.
async function read(response: Response) {
  const text = await response.text();
  const credits = response.headers.get("Ant-credits-cost");
  if (!response.ok) throw new Error(`ScrapingAnt returned ${response.status}: ${text.slice(0, 2000)}`);
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {}
  return { creditsCost: credits, pageStatusCode: response.headers.get("Ant-page-status-code"), body };
}

const tools = (account: Account, fetcher: Fetch, signal: AbortSignal | undefined) => {
  const token = account.fields.token;
  const get = async (path: string, params: Record<string, unknown>) =>
    read(await fetcher(buildUrl(path, params, token), { signal }));

  return router({
    scrape: query(
      {
        description: `Fetch a web page through ScrapingAnt's rotating proxies and headless Chrome (with anti-bot and Cloudflare bypass) and return its HTML. ${commonNotes}`,
        input: object(common()),
      },
      async (_ctx, input) => get("/general", input),
    ),
    scrapeWithJavaScript: mutation(
      {
        description: `Like scrape, but runs a JavaScript snippet in the page once it has loaded (for scrolling, clicking or clearing banners). The snippet runs on the target site, so this needs approval. Provide the snippet as plain JavaScript; it is base64-encoded for you. Needs a browser. ${commonNotes}`,
        input: object({ ...common(), js_snippet: string({ minLength: 1 }) }),
        approval: always(),
      },
      async (_ctx, { js_snippet, ...rest }) =>
        get("/general", { ...rest, browser: true, js_snippet: toBase64(js_snippet) }),
    ),
    scrapeWithBody: mutation(
      {
        description: `Send a POST, PUT, PATCH or DELETE request (method must be one of these) to the target URL through ScrapingAnt (form submissions, APIs behind anti-bot). The body is forwarded as given; set contentType to the target's content type (sent to ScrapingAnt as the Ant-Content-Type header, which it forwards as Content-Type). ${commonNotes}`,
        input: object({
          ...common(),
          method: string().default("POST"),
          body: string().optional(),
          contentType: string().optional(),
        }),
        approval: always(),
      },
      async (_ctx, { method, body, contentType, ...rest }) => {
        const verb = method.toUpperCase();
        if (!["POST", "PUT", "PATCH", "DELETE"].includes(verb)) throw new Error("method must be POST, PUT, PATCH or DELETE (use scrape for GET)");
        return read(
          await fetcher(buildUrl("/general", rest, token), {
            method: verb,
            signal,
            body,
            headers: contentType === undefined ? undefined : { "Ant-Content-Type": contentType },
          }),
        );
      },
    ),
    markdown: query(
      {
        description: `Fetch a page and return it as LLM-ready markdown ({ url, markdown }). Navigation and footers are kept. ${commonNotes}`,
        input: object(common()),
      },
      async (_ctx, input) => get("/markdown", input),
    ),
    extended: query(
      {
        description: `Fetch a page and return a JSON envelope with html, text, cookies, the target site's status_code and headers, plus xhrs (captured XHR requests) and iframes when a browser is used. ${commonNotes}`,
        input: object(common()),
      },
      async (_ctx, input) => get("/extended", input),
    ),
    extract: query(
      {
        description: `AI data extraction: fetch a page, convert it to markdown and have an LLM pull out the properties you describe, returned as JSON with camelCase keys. extract_properties is free-form, usually a comma-separated list such as "product title, price, full description", and accepts hints like "price(number), reviews(list: review title, review content)". Billed by markdown and output size. ${commonNotes}`,
        input: object({ ...common(), extract_properties: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => get("/extract", input),
    ),
    usage: query(
      {
        description: "Current plan, billing period dates, total credits and remaining credits. Free to call.",
        input: object({}),
      },
      async () => get("/usage", {}),
    ),
  });
};

export default defineApp({ user: { accounts: { scrapingant: scrapingant.many() } }, icons }, async ({ user, fetch, signal }) => ({
  tools: router(await accountRouter(user?.accounts.scrapingant ?? [], (account) => tools(account, fetch, signal), { signal }), {
    title: "ScrapingAnt",
    description:
      "Scrape any web page through headless Chrome and rotating proxies: raw HTML, markdown for LLMs, AI-extracted structured data, extended JSON responses and credit usage.",
    icons,
  }),
}));
