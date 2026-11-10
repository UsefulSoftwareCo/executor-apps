import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://app.zenserp.com/api";

const zenserp = defineProvider({
  name: "Zenserp",
  hosts: ["app.zenserp.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The status endpoint is read-only: it returns the remaining request quota.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v2/status`, {
      signal,
      headers: { apikey: account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({ remaining_requests: number() }));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ apikey: account.fields.token, Accept: "application/json" });

const search = (params: Record<string, string | number | readonly string[] | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (typeof value === "object") for (const item of value) out.append(key, item);
    else out.set(key, String(value));
  }
  return out.toString();
};

const searchInput = {
  q: string(),
  location: string().optional(),
  hl: string().optional(),
  gl: string().optional(),
  device: string().optional(),
  num: number().optional(),
  start: number().optional(),
};

const searchDetails =
  " location is a canonical location name from metadata.locations; hl is the interface language and gl the country code (see metadata.languages and metadata.countries); device is desktop, tablet or mobile; num is 1-100 results; start is the result offset. Each successful call uses one request of quota.";

const zenserpTools = (account: Account, signal: AbortSignal) => {
  const get = (path: string, params: Record<string, string | number | readonly string[] | undefined> = {}) =>
    async ({ fetch }: { fetch: typeof globalThis.fetch }) =>
      decodeJson(
        await fetch(`${base}${path}${Object.keys(params).length > 0 ? `?${search(params)}` : ""}`, {
          signal,
          headers: headers(account),
        }),
        json(),
      );
  return router({
    search: router(
      {
        google: query(
          {
            description:
              "Search Google and return structured SERP data: organic results, paid results, images, related searches and result counts." +
              searchDetails,
            input: object(searchInput),
          },
          async (ctx, input) => get("/v2/search", input)(ctx),
        ),
        bing: query(
          { description: "Search Bing and return structured SERP data." + searchDetails, input: object(searchInput) },
          async (ctx, input) => get("/v2/search", { ...input, search_engine: "bing.com" })(ctx),
        ),
        yandex: query(
          {
            description: "Search Yandex and return structured SERP data." + searchDetails,
            input: object(searchInput),
          },
          async (ctx, input) => get("/v2/search", { ...input, search_engine: "yandex.com" })(ctx),
        ),
        reverseImage: query(
          {
            description:
              "Run a Google reverse-image search for a publicly reachable image URL and return the matching pages and visually similar images.",
            input: object({
              imageUrl: string(),
              location: string().optional(),
              gl: string().optional(),
              hl: string().optional(),
            }),
          },
          async (ctx, { imageUrl, ...input }) => get("/v2/search", { ...input, image_url: imageUrl })(ctx),
        ),
      },
      { title: "Search", description: "Web and image search across Google, Bing and Yandex." },
    ),
    shopping: query(
      {
        description: "Retrieve Google Shopping product details (title, description, reviews, specifications, sellers) by product id.",
        input: object({
          productId: string(),
          location: string().optional(),
          gl: string().optional(),
          hl: string().optional(),
        }),
      },
      async (ctx, { productId, ...input }) => get("/v1/shopping", { ...input, product_id: productId })(ctx),
    ),
    trends: query(
      {
        description:
          "Retrieve Google's currently trending searches (Trends API, covers at most the past 7 days). geo is a country code such as 'US'; cat is a Google Trends category id (for example 20 for Sports, 18 for Shopping, 16 for News); timeframe is 'now 1-H', 'now 4-H', 'now 1-d' or 'now 7-d'. keywords optionally narrows the trends to those matching the given terms; omit it to get all trending searches.",
        input: object({
          keywords: array(string()).optional(),
          geo: string().optional(),
          cat: string().optional(),
          timeframe: string().optional(),
          hl: string().optional(),
          gl: string().optional(),
        }),
      },
      async (ctx, { keywords, ...input }) =>
        get("/v1/trends", { ...input, ...(keywords ? { "keyword[]": keywords } : {}) })(ctx),
    ),
    account: router(
      {
        status: query(
          { description: "Return the remaining request quota for the API key.", input: object({}) },
          async (ctx) => get("/v2/status")(ctx),
        ),
        batches: query(
          {
            description: "List batches submitted for asynchronous processing (Medium plan and above). page starts at 1.",
            input: object({ page: number().optional(), limit: number().optional() }),
          },
          async (ctx, input) => get("/v1/batches", input)(ctx),
        ),
      },
      { title: "Account", description: "Quota and batch information for the API key." },
    ),
    metadata: router(
      {
        countries: query(
          { description: "List supported Google country (gl) parameter values.", input: object({}) },
          async (ctx) => get("/v2/gl")(ctx),
        ),
        languages: query(
          { description: "List supported Google interface language (hl) parameter values.", input: object({}) },
          async (ctx) => get("/v2/hl")(ctx),
        ),
        locations: query(
          {
            description: "List supported geolocation targets, optionally filtered by a search string q.",
            input: object({ q: string().optional() }),
          },
          async (ctx, input) => get("/v2/locations", input)(ctx),
        ),
        searchEngines: query(
          { description: "List supported search-engine domains for the search_engine parameter.", input: object({}) },
          async (ctx) => get("/v2/search_engines")(ctx),
        ),
      },
      { title: "Metadata", description: "Valid values for search parameters." },
    ),
  });
};

export default defineApp({ user: { accounts: { zenserp: zenserp.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.zenserp ?? [], (account) => zenserpTools(account, signal), { signal }), {
    title: "Zenserp",
    description:
      "Real-time Google, Bing and Yandex search results as JSON: web search, reverse image search, Google Trends, Shopping product details and search-parameter lookups.",
    icons,
  }),
}));
