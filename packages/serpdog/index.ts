import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://api.serpdog.io";

const serpdog = defineProvider({
  name: "Serpdog",
  hosts: ["api.serpdog.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Serpdog authenticates with an api_key query parameter; the account endpoint is free of search credits.
  async health({ account, fetch, signal }) {
    const url = new URL(`${base}/account_info`);
    url.searchParams.set("api_key", account.fields.token);
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Spec = {
  readonly endpoint: string;
  readonly description: string;
  // Parameters the API requires, exposed as top-level string inputs.
  readonly required: readonly string[];
};

const options = "Optional extra parameters go in `params` (for example gl, hl, num, page, domain, html).";

const specs = {
  account: {
    info: { endpoint: "account_info", description: "Plan, quota and remaining request credits for the account.", required: [] },
  },
  google: {
    search: { endpoint: "search", description: `Google Search results (advanced, with featured snippets). ${options}`, required: ["q"] },
    liteSearch: { endpoint: "lite_search", description: `Google Search results, faster and half the credit cost, fewer featured snippets. ${options}`, required: ["q"] },
    news: { endpoint: "news", description: `Google News results. ${options}`, required: ["q"] },
    images: { endpoint: "images", description: `Google Images results. ${options}`, required: ["q"] },
    videos: { endpoint: "videos", description: `Google Videos results. ${options}`, required: ["q"] },
    autocomplete: { endpoint: "autocomplete", description: `Google Autocomplete suggestions. ${options}`, required: ["q"] },
    shopping: { endpoint: "shopping", description: `Google Shopping results. ${options}`, required: ["q"] },
    product: { endpoint: "product", description: `Google Product details: sellers, reviews and specs. ${options}`, required: ["product_id"] },
    finance: { endpoint: "finance", description: `Google Finance data for a ticker or index, for example AAPL or NIFTY_50:INDEXNSE. ${options}`, required: ["q"] },
    scholar: { endpoint: "scholar", description: `Google Scholar results. ${options}`, required: ["q"] },
    scholarAuthor: { endpoint: "scholar_author", description: "Google Scholar author profile: details, articles and co-authors. Extra parameters go in `params`.", required: ["author_id"] },
    jobs: { endpoint: "jobs", description: `Google Jobs postings. ${options}`, required: ["q"] },
  },
  maps: {
    search: { endpoint: "maps_search", description: "Google Maps place search. `ll` (for example @40.7455,-74.0083,15.1z) sets the viewport; other parameters go in `params`.", required: ["q"] },
    reviews: { endpoint: "reviews", description: "Google Maps reviews for a place data_id (for example 0x89c25090129c363d:0x40c6a5770d25022b). Extra parameters go in `params`.", required: ["data_id"] },
    photos: { endpoint: "maps_photos", description: "Google Maps photos for a place data_id. Extra parameters go in `params`.", required: ["data_id"] },
    posts: { endpoint: "maps_post", description: "Google Maps posts for a place data_id. Extra parameters go in `params`.", required: ["data_id"] },
  },
  bing: {
    search: { endpoint: "bing_search", description: `Bing Search results. ${options}`, required: ["q"] },
  },
  youtube: {
    search: { endpoint: "youtube", description: `YouTube search results. ${options}`, required: ["q"] },
  },
  yelp: {
    search: { endpoint: "yelp", description: "Yelp search results. find_desc is the business or category, find_loc the location. Extra parameters go in `params`.", required: ["find_desc", "find_loc"] },
  },
  amazon: {
    search: { endpoint: "amazon_search", description: "Amazon search results for a search page URL (for example https://www.amazon.com/s?k=nike+shoes). Extra parameters go in `params`.", required: ["url"] },
    product: { endpoint: "amazon_product", description: "Amazon product details by ASIN. domain is the marketplace suffix such as com. Extra parameters go in `params`.", required: ["domain", "asin"] },
    reviews: { endpoint: "amazon_reviews", description: "Amazon product reviews. domain is the marketplace suffix such as com. Extra parameters go in `params`.", required: ["domain", "product_id"] },
    autocomplete: { endpoint: "amazon_autocomplete", description: "Amazon search suggestions. mid is the marketplace id (for example ATVPDKIKX0DER for amazon.com). Extra parameters go in `params`.", required: ["prefix", "mid"] },
  },
  walmart: {
    product: { endpoint: "walmart_product", description: "Walmart product details by product_id. Optional store_id selects the Walmart store. Extra parameters go in `params`.", required: ["product_id"] },
  },
  linkedin: {
    jobs: { endpoint: "linkedin_jobs", description: "LinkedIn job postings. Filters such as job_type, sort_by, exp_level and geoId go in `params`.", required: ["q"] },
  },
  web: {
    scrape: { endpoint: "scrape", description: "Fetch any web page through Serpdog's proxy network and return its HTML. Options in `params`: render_js, premium, wait (ms), country.", required: ["url"] },
  },
} as const satisfies Record<string, Record<string, Spec>>;

function tool(token: string, fetcher: Fetch, signal: AbortSignal | undefined, spec: Spec) {
  return query(
    {
      description: spec.description,
      input: object({
        ...Object.fromEntries(spec.required.map((name) => [name, string({ minLength: 1 })])),
        params: record(json()).optional(),
      }),
    },
    async (_ctx, input: Record<string, unknown>) => {
      const url = new URL(`${base}/${spec.endpoint}`);
      const extra = (input.params ?? {}) as Record<string, unknown>;
      for (const [key, value] of Object.entries(extra)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
      for (const name of spec.required) url.searchParams.set(name, String(input[name]));
      url.searchParams.set("api_key", token);
      const response = await fetcher(url.toString(), { signal });
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("json")) return { status: response.status, body: await response.text() };
      return decodeJson(response, json());
    },
  );
}

const titles: Record<string, string> = {
  account: "Account",
  google: "Google",
  maps: "Google Maps",
  bing: "Bing",
  youtube: "YouTube",
  yelp: "Yelp",
  amazon: "Amazon",
  walmart: "Walmart",
  linkedin: "LinkedIn Jobs",
  web: "Web scraping",
};

export default defineApp(
  { user: { accounts: { serpdog: serpdog.many() } }, icons },
  async ({ user, signal, fetch }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.serpdog ?? [],
        (account) =>
          router(
            Object.fromEntries(
              Object.entries(specs).map(([group, tools]) => [
                group,
                router(
                  Object.fromEntries(
                    Object.entries(tools).map(([name, spec]) => [name, tool(account.fields.token, fetch, signal, spec)]),
                  ),
                  { title: titles[group]!, description: `Serpdog ${titles[group]} endpoints.` },
                ),
              ]),
            ),
          ),
        { signal },
      ),
      {
        title: "Serpdog",
        description: "Scrape search results and web data with Serpdog: Google (Search, News, Images, Shopping, Finance, Scholar, Jobs, Maps), Bing, YouTube, Yelp, Amazon, Walmart (product), LinkedIn Jobs and a generic web scraper.",
        icons,
      },
    ),
  }),
);
