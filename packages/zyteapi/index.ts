import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const endpoint = "https://api.zyte.com/v1/extract";

const zyte = defineProvider({
  name: "Zyte API",
  hosts: ["api.zyte.com"],
  auth: {
    apiKey: secrets({
      label: "Zyte API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Zyte has no free account endpoint. An empty extraction body is rejected with 400 (no request is
  // made, nothing is billed) only after the key has been authenticated; a bad key gets 401.
  async health({ account, fetch, signal }) {
    const response = await fetch(endpoint, {
      method: "POST",
      signal,
      headers: { Authorization: auth(account.fields.token), "Content-Type": "application/json" },
      body: "{}",
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Zyte API rejected the API key (${response.status})`);
    }
    await response.arrayBuffer();
  },
});

type Account = { fields: { token: string } };
type Fetch = typeof fetch;

// The API key is the Basic auth username; the password is empty.
const auth = (token: string) => `Basic ${btoa(`${token}:`)}`;

// Options shared by every request. ipType is "datacenter" or "residential"; geolocation is an ISO 3166-1 alpha-2 code.
const common = () => ({
  url: string({ minLength: 1 }),
  geolocation: string().optional(),
  ipType: string().optional(),
  device: string().optional(),
});

const commonNotes =
  "Optional: geolocation (ISO 3166-1 alpha-2 country code to send the request from), ipType (datacenter or residential), device (desktop or mobile). Each request is billed per Zyte API pricing, which depends on the site and the features used.";

const extractFromNote =
  "extractFrom is browserHtml or httpResponseBody and chooses the input used for extraction; it defaults to a browser request.";

function decodeBase64(value: string): string {
  const bytes = Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function post(fetcher: Fetch, token: string, signal: AbortSignal | undefined, body: Record<string, unknown>) {
  const clean = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined && v !== null));
  const response = await fetcher(endpoint, {
    method: "POST",
    signal,
    headers: { Authorization: auth(token), "Content-Type": "application/json", "Accept-Encoding": "gzip, deflate" },
    body: JSON.stringify(clean),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Zyte API returned ${response.status}: ${text.slice(0, 2000)}`);
  return JSON.parse(text) as Record<string, unknown>;
}

const tools = (account: Account, fetcher: Fetch, signal: AbortSignal | undefined) => {
  const token = account.fields.token;
  const send = (body: Record<string, unknown>) => post(fetcher, token, signal, body);

  // One tool per automatic-extraction data type: sets the flag and returns the matching response field.
  const automatic = (flag: string, what: string, extra: string) =>
    query(
      {
        description: `${what} ${extra} Returns { url, statusCode, ${flag}, ... }. ${extractFromNote} ${commonNotes}`,
        input: object({ ...common(), extractFrom: string().optional() }),
      },
      async (_ctx, input) => {
        const { extractFrom, ...rest } = input;
        const result = await send({ ...rest, [flag]: true, extractFrom });
        return { url: result.url, statusCode: result.statusCode, [flag]: result[flag], metadata: (result[flag] as { metadata?: unknown } | undefined)?.metadata };
      },
    );

  return router({
    browserHtml: query(
      {
        description: `Load a page in a real browser (JavaScript executed, anti-ban handled) and return the rendered HTML as { url, statusCode, browserHtml }. Set javascript to force JavaScript execution on or off. ${commonNotes}`,
        input: object({ ...common(), javascript: boolean().optional(), includeIframes: boolean().optional() }),
      },
      async (_ctx, input) => {
        const result = await send({ ...input, browserHtml: true });
        return { url: result.url, statusCode: result.statusCode, browserHtml: result.browserHtml };
      },
    ),
    httpResponse: query(
      {
        description: `Fetch a page with a plain HTTP request (cheaper than a browser, anti-ban handled) and return the decoded body as { url, statusCode, body, headers }. Use followRedirect=false to stop at redirects. ${commonNotes}`,
        input: object({ ...common(), followRedirect: boolean().optional() }),
      },
      async (_ctx, input) => {
        const result = await send({ ...input, httpResponseBody: true, httpResponseHeaders: true });
        const body = typeof result.httpResponseBody === "string" ? decodeBase64(result.httpResponseBody) : undefined;
        return { url: result.url, statusCode: result.statusCode, body, headers: result.httpResponseHeaders };
      },
    ),
    screenshot: query(
      {
        description: `Render a page in a browser and return a screenshot as { url, statusCode, screenshot } where screenshot is base64-encoded. Use format (jpeg or png) and fullPage (default false) to adjust. ${commonNotes}`,
        input: object({ ...common(), format: string().optional(), fullPage: boolean().optional() }),
      },
      async (_ctx, { format, fullPage, ...rest }) => {
        const screenshotOptions =
          format === undefined && fullPage === undefined ? undefined : { format, fullPage };
        const result = await send({ ...rest, screenshot: true, screenshotOptions });
        return { url: result.url, statusCode: result.statusCode, screenshot: result.screenshot };
      },
    ),
    product: automatic("product", "AI-extract a single product page (name, price, availability, images, SKU, brand, description, variants).", "The URL should be a product detail page."),
    productList: automatic("productList", "AI-extract the list of products from a listing or category page.", "The URL should be a product listing page."),
    productNavigation: automatic("productNavigation", "AI-extract navigation from a product listing page: product links, the next page link and subcategories.", "Use it to crawl a store."),
    article: automatic("article", "AI-extract a news or blog article (headline, author, date, body text and HTML, images).", "The URL should be an article page."),
    articleList: automatic("articleList", "AI-extract the list of articles from a feed or index page.", "The URL should be an article listing page."),
    articleNavigation: automatic("articleNavigation", "AI-extract navigation from an article listing page: article links, the next page link and subcategories.", "Use it to crawl a news site."),
    forumThread: automatic("forumThread", "AI-extract a forum thread (posts, authors, dates, votes).", "The URL should be a forum thread page."),
    jobPosting: automatic("jobPosting", "AI-extract a job posting (title, company, location, salary, description, employment type).", "The URL should be a job detail page."),
    jobPostingNavigation: automatic("jobPostingNavigation", "AI-extract navigation from a job listing page: job links and the next page link.", "Use it to crawl a job board."),
    pageContent: automatic("pageContent", "AI-extract the main content of any page as clean text, HTML and metadata.", "Works on pages that are not products or articles."),
    serp: query(
      {
        description: `AI-extract a search engine results page (organic results with title, URL, description and rank). Pass the search results page URL, optionally with keyword for the query, and extractFrom (browserHtml or httpResponseBody, default httpResponseBody). ${commonNotes}`,
        input: object({ ...common(), keyword: string().optional(), extractFrom: string().optional() }),
      },
      async (_ctx, { keyword, extractFrom, ...rest }) => {
        const serpOptions = keyword === undefined && extractFrom === undefined ? undefined : { keyword, extractFrom };
        const result = await send({ ...rest, serp: true, serpOptions });
        return { url: result.url, statusCode: result.statusCode, serp: result.serp };
      },
    ),
    request: mutation(
      {
        description: `Send a non-GET request (POST, PUT, PATCH, DELETE) to the target URL through Zyte API, for form submissions and APIs behind anti-ban protection. Provide httpRequestText as the UTF-8 request body and customHttpRequestHeaders as [{ name, value }] (for example Content-Type). Returns { url, statusCode, body, headers }. ${commonNotes}`,
        input: object({
          ...common(),
          httpRequestMethod: string({ minLength: 1 }),
          httpRequestText: string().optional(),
          customHttpRequestHeaders: json().optional(),
        }),
        approval: always(),
      },
      async (_ctx, input) => {
        const result = await send({ ...input, httpResponseBody: true, httpResponseHeaders: true });
        const body = typeof result.httpResponseBody === "string" ? decodeBase64(result.httpResponseBody) : undefined;
        return { url: result.url, statusCode: result.statusCode, body, headers: result.httpResponseHeaders };
      },
    ),
    extract: mutation(
      {
        description:
          "Send any raw Zyte API extraction request (POST /v1/extract) and return the full JSON response. Use it for features the other tools do not cover: browser actions, sessions, network capture, cookies, customAttributes, extraction options and model pinning. request is the JSON body, for example { url, browserHtml: true, actions: [...] }. Actions run scripted clicks and typing on the target site, so this needs approval. See https://docs.zyte.com/zyte-api/usage/reference.html for the full schema.",
        input: object({ request: record(json()) }),
        approval: always(),
      },
      async (_ctx, { request }) => send(request),
    ),
  });
};

export default defineApp({ user: { accounts: { zyte: zyte.many() } }, icons }, async ({ user, fetch, signal }) => ({
  tools: router(await accountRouter(user?.accounts.zyte ?? [], (account) => tools(account, fetch, signal), { signal }), {
    title: "Zyte API",
    description:
      "Scrape any website through Zyte API: rendered HTML, raw HTTP responses, screenshots, and AI extraction of products, articles, jobs, forum threads, page content and search results.",
    icons,
  }),
}));
