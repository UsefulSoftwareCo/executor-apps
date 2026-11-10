import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://serpapi.com";

const serpapi = defineProvider({
  name: "SerpApi",
  hosts: ["serpapi.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/account.json?api_key=${encodeURIComponent(account.fields.token)}`, { signal });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

// SerpApi authenticates with an api_key query parameter. Every call here is a read.
function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, params: Params = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    url.searchParams.set("api_key", token);
    const response = await fetcher(url.toString(), { signal });
    return decodeJson(response, json());
  };
}

// engine id, tool name, the engine's main query parameter (null when it has none), description
const engines: readonly [string, string, string | null, string][] = [
  ["google", "google", "q", "Google web search: organic results, answer boxes, knowledge graph, ads, related questions."],
  ["google_images", "googleImages", "q", "Google Images results."],
  ["google_images_light", "googleImagesLight", "q", "Faster, lighter Google Images results."],
  ["google_videos", "googleVideos", "q", "Google Videos results."],
  ["google_news", "googleNews", "q", "Google News results (use topic_token or publication_token to browse topics and publishers)."],
  ["google_maps", "googleMaps", "q", "Google Maps place search. Pass ll as @lat,lng,zoomz to anchor the search; use data_id for a place."],
  ["google_shopping", "googleShopping", "q", "Google Shopping product results."],
  ["google_jobs", "googleJobs", "q", "Google Jobs listings."],
  ["google_scholar", "googleScholar", "q", "Google Scholar papers and citations."],
  ["google_finance", "googleFinance", "q", "Google Finance quotes and market data for a ticker like GOOGL:NASDAQ."],
  ["google_trends", "googleTrends", "q", "Google Trends interest over time, by region, related queries (set data_type)."],
  ["google_flights", "googleFlights", null, "Google Flights. Needs departure_id, arrival_id, outbound_date; round trips also return_date."],
  ["google_hotels", "googleHotels", "q", "Google Hotels. Needs check_in_date and check_out_date."],
  ["google_events", "googleEvents", "q", "Google Events listings."],
  ["google_autocomplete", "googleAutocomplete", "q", "Google search suggestions for a partial query."],
  ["google_play", "googlePlay", "q", "Google Play Store apps, books, movies (set store)."],
  ["google_lens", "googleLens", null, "Google Lens visual search. Needs url of an image."],
  ["google_ai_mode", "googleAiMode", "q", "Google AI Mode answer for a question."],
  ["google_patents", "googlePatents", "q", "Google Patents search."],
  ["bing", "bing", "q", "Bing web search."],
  ["bing_images", "bingImages", "q", "Bing Images results."],
  ["bing_news", "bingNews", "q", "Bing News results."],
  ["bing_videos", "bingVideos", "q", "Bing Videos results."],
  ["bing_maps", "bingMaps", "q", "Bing Maps place search."],
  ["duckduckgo", "duckduckgo", "q", "DuckDuckGo web search."],
  ["yahoo", "yahoo", "p", "Yahoo web search."],
  ["yandex", "yandex", "text", "Yandex web search."],
  ["baidu", "baidu", "q", "Baidu web search."],
  ["naver", "naver", "query", "Naver web search."],
  ["youtube", "youtube", "search_query", "YouTube video search."],
  ["amazon", "amazon", "k", "Amazon product search (set amazon_domain)."],
  ["walmart", "walmart", "query", "Walmart product search."],
  ["ebay", "ebay", "_nkw", "eBay listings search."],
  ["home_depot", "homeDepot", "q", "Home Depot product search."],
  ["apple_app_store", "appleAppStore", "term", "Apple App Store app search."],
  ["yelp", "yelp", "find_desc", "Yelp business search; set find_loc for the location."],
  ["facebook_profile", "facebookProfile", null, "Public Facebook profile data. Needs profile_id."],
  ["tripadvisor", "tripadvisor", "q", "Tripadvisor search."],
  ["open_table_reviews", "openTableReviews", null, "OpenTable reviews. Needs rid (the restaurant path, such as r/<slug>)."],
];

function build(call: ReturnType<typeof client>) {
  const engineTools = Object.fromEntries(
    engines.map(([engine, name, key, description]) => [
      name,
      query(
        {
          description: `${description} Engine: ${engine}. Billed as one search; cached results are free.`,
          input: object({
            query: string().optional(),
            params: record(json()).optional(),
          }),
        },
        async (_ctx, { query: text, params }) =>
          call("/search.json", { ...(params ?? {}), engine, ...(key !== null && text !== undefined ? { [key]: text } : {}) }),
      ),
    ]),
  );

  return router({
    search: query(
      {
        description:
          "Run any SerpApi engine. Set engine (google, bing, youtube, amazon, ...) and that engine's parameters in params (q, location, hl, gl, num, start, device, ...). Prefer an engine-specific tool when one exists. Each non-cached search consumes one credit.",
        input: object({ engine: string({ minLength: 1 }), params: record(json()).optional() }),
      },
      async (_ctx, { engine, params }) => call("/search.json", { ...(params ?? {}), engine }),
    ),
    ...engineTools,
    account: query(
      { description: "Plan, searches used this month, searches left, rate limit and API key status.", input: object({}) },
      async () => call("/account.json"),
    ),
    locations: query(
      {
        description: "Look up supported location names for the location parameter. Free; no key needed but sent anyway.",
        input: object({ q: string().optional(), limit: number().optional() }),
      },
      async (_ctx, { q, limit }) => call("/locations.json", { q, limit }),
    ),
    searchArchive: router(
      {
        get: query(
          {
            description: "Retrieve a previously run search by its search_id from the archive. Free.",
            input: object({ searchId: string({ minLength: 1 }) }),
          },
          async (_ctx, { searchId }) => call(`/searches/${encodeURIComponent(searchId)}.json`),
        ),
        list: query(
          {
            description: "List archived searches. Filter by q, engine, status, date range (start_date, end_date) and paginate with limit and offset. Free.",
            input: object({ params: record(json()).optional() }),
          },
          async (_ctx, { params }) => call("/searches.json", params ?? {}),
        ),
      },
      { title: "Search archive", description: "Past searches stored by SerpApi." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { serpapi: serpapi.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.serpapi ?? [], (account) => build(client(account.fields.token, fetch, signal)), { signal }),
      {
        title: "SerpApi",
        description:
          "Real-time structured search results from Google, Bing, DuckDuckGo, YouTube, Amazon, Walmart, eBay and other engines, plus account usage, locations and the search archive.",
        icons,
      },
    ),
  }),
);
