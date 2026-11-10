import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  record,
  router,
  secrets,
  string,
  type Fields,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const api = "https://api.scrape.do";
const queue = "https://q.scrape.do/api/v1";

const scrapedo = defineProvider({
  name: "Scrape.do",
  hosts: ["api.scrape.do", "q.scrape.do"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The usage endpoint is read-only, free, and limited to 10 requests per minute.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${api}/info?token=${encodeURIComponent(account.fields.token)}`, { signal });
    await decodeJson(response, object({ IsActive: boolean() }));
  },
});

type Account = { fields: { token: string } };
type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function toQuery(params: Params): URLSearchParams {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    out.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  }
  return out;
}

// Scrape.do answers with the target page, which is often HTML, so a body that is not JSON comes back as text.
// Scrape.do bills 400, 404 and 410 target responses, so scrape tools pass those through with their cost headers.
const billedStatuses = [400, 404, 410];

async function read(response: Response, passThrough: readonly number[] = []) {
  const text = await response.text();
  if (!response.ok && !passThrough.includes(response.status)) throw new Error(`Scrape.do returned ${response.status}: ${text.slice(0, 2000)}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const scrapeHeaders = (response: Response) => ({
  requestCost: response.headers.get("Scrape.do-Request-Cost"),
  remainingCredits: response.headers.get("Scrape.do-Remaining-Credits"),
  resolvedUrl: response.headers.get("Scrape.do-Resolved-Url"),
  initialStatusCode: response.headers.get("Scrape.do-Initial-Status-Code"),
});

const scrapedoTools = (account: Account, fetcher: Fetch, signal: AbortSignal | undefined) => {
  const token = account.fields.token;

  const get = async (path: string, params: Params = {}) => {
    const url = new URL(`${api}${path}`);
    for (const [key, value] of toQuery(params)) url.searchParams.set(key, value);
    url.searchParams.set("token", token);
    return read(await fetcher(url.toString(), { signal }));
  };

  const queued = async (path: string, init: { method?: string; params?: Params; body?: unknown } = {}) => {
    const url = new URL(`${queue}${path}`);
    for (const [key, value] of toQuery(init.params ?? {})) url.searchParams.set(key, value);
    return read(
      await fetcher(url.toString(), {
        method: init.method ?? "GET",
        signal,
        headers: { "X-Token": token, "content-type": "application/json" },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      }),
    );
  };

  // A structured scraper endpoint: the named fields plus `params` for any other documented query parameter.
  const ready = <F extends Fields>(path: string, description: string, fields: F) =>
    query(
      {
        description: `${description} Pass any other documented query parameter (hl, gl, device, include_html, super and so on) in params.`,
        input: object({ ...fields, params: record(json()).optional() }),
      },
      async (_ctx, input) => {
        const { params, ...named } = input as Params & { params?: Params };
        return get(path, { ...params, ...named });
      },
    );

  const s = () => string();
  const so = () => string().optional();
  const no = () => number().optional();

  return router({
    scrape: query(
      {
        description:
          "Fetch a URL through Scrape.do's rotating proxies with anti-bot, WAF and CAPTCHA bypass, and return its body (HTML, JSON or markdown). Costs 1 credit; super (residential/mobile) and render (headless browser) cost more. Unmentioned options go in params, for example regionalGeoCode, sessionId, device, waitUntil, customWait, waitSelector, width, height, blockResources, screenShot, fullScreenShot, returnJSON, showFrames, pureCookies, timeout, disableRetry, setCookies. Browser actions (playWithBrowser) can click and run JavaScript on the target site, so they are refused here; use scrapeWithBrowserActions, which needs approval. Targets that answer 400, 404 or 410 are billed, so those statuses return with the cost headers instead of an error.",
        input: object({
          url: string({ minLength: 1 }),
          super: boolean().optional(),
          render: boolean().optional(),
          geoCode: so(),
          output: so(),
          transparentResponse: boolean().optional(),
          params: record(json()).optional(),
        }),
      },
      async (_ctx, { params, ...named }) => {
        if (params && Object.keys(params).some((k) => k.toLowerCase() === "playwithbrowser"))
          throw new Error("playWithBrowser can click and execute JavaScript on the target site; use scrapeWithBrowserActions.");
        const url = new URL(`${api}/`);
        for (const [key, value] of toQuery({ ...params, ...named })) url.searchParams.set(key, value);
        url.searchParams.set("token", token);
        const response = await fetcher(url.toString(), { signal });
        return { status: response.status, ...scrapeHeaders(response), body: await read(response, billedStatuses) };
      },
    ),
    scrapeWithBrowserActions: mutation(
      {
        description:
          "Fetch a URL in Scrape.do's headless browser and run playWithBrowser actions (Click, Execute JavaScript, Fill, Wait, ScrollTo and so on) on the target site. Actions can submit forms or press buy buttons, so this needs approval. Set playWithBrowser to the documented array of action objects; other options go in params as in scrape. Billed 400, 404 and 410 targets return with the cost headers.",
        input: object({
          url: string({ minLength: 1 }),
          playWithBrowser: array(record(json())),
          super: boolean().optional(),
          geoCode: so(),
          params: record(json()).optional(),
        }),
        approval: always(),
      },
      async (_ctx, { params, ...named }) => {
        const url = new URL(`${api}/`);
        for (const [key, value] of toQuery({ ...params, ...named, render: true })) url.searchParams.set(key, value);
        url.searchParams.set("token", token);
        const response = await fetcher(url.toString(), { signal });
        return { status: response.status, ...scrapeHeaders(response), body: await read(response, billedStatuses) };
      },
    ),
    scrapeWithBody: mutation(
      {
        description:
          "Send a POST, PUT, PATCH or DELETE request to a target URL through Scrape.do (for form submissions and APIs). The body is forwarded as given. Set contentType to match, for example application/json or application/x-www-form-urlencoded. Other options go in params as in scrape.",
        input: object({
          url: string({ minLength: 1 }),
          method: string().default("POST"),
          body: string().optional(),
          contentType: so(),
          super: boolean().optional(),
          render: boolean().optional(),
          geoCode: so(),
          params: record(json()).optional(),
        }),
        approval: always(),
      },
      async (_ctx, { params, method, body, contentType, ...named }) => {
        const url = new URL(`${api}/`);
        for (const [key, value] of toQuery({ ...params, ...named })) url.searchParams.set(key, value);
        url.searchParams.set("token", token);
        const response = await fetcher(url.toString(), {
          method,
          signal,
          body,
          headers: contentType === undefined ? undefined : { "content-type": contentType },
        });
        return { status: response.status, ...scrapeHeaders(response), body: await read(response, billedStatuses) };
      },
    ),
    usage: query(
      {
        description:
          "Subscription usage: whether it is active, concurrency limit and remaining, monthly request limit and remaining. Limited to 10 requests per minute.",
        input: object({}),
      },
      async () => get("/info"),
    ),

    amazon: router(
      {
        product: ready(
          "/plugin/amazon/pdp",
          "Amazon product detail page as structured JSON: price, images, rating, buy box, reviews, best-seller rank. geocode is the marketplace country (us, gb, de...). Give zipcode or countryName, not both. Needs asin.",
          { asin: s(), geocode: s(), zipcode: so(), countryName: so(), language: so(), currency: so() },
        ),
        offers: ready(
          "/plugin/amazon/offer-listing",
          "All seller offers for an Amazon product: condition, seller, price, shipping, Prime and Buy Box status.",
          { asin: s(), geocode: s(), zipcode: so(), countryName: so(), language: so(), currency: so() },
        ),
        search: ready(
          "/plugin/amazon/search",
          "Search Amazon, or scrape a category page, as structured JSON with pagination.",
          { keyword: s(), geocode: s(), zipcode: so(), countryName: so(), page: no(), language: so(), currency: so() },
        ),
        deals: ready(
          "/plugin/amazon/deals",
          "Amazon's discounted products as a paginated, filterable grid (currently the us marketplace). Filters: node, low_price, high_price, sort_by, rh, i.",
          { geocode: s(), node: so(), page: no(), zipcode: so(), countryName: so() },
        ),
        bestsellers: ready(
          "/plugin/amazon/bestsellers",
          "Amazon Best Sellers or New Releases chart (type bestsellers or new-releases) for a category slug, 50 positions per page.",
          { category: s(), geocode: s(), type: so(), node: so(), page: no(), zipcode: so(), countryName: so() },
        ),
        seller: ready(
          "/plugin/amazon/seller",
          "Amazon seller profile: display name, business details and feedback percentage. Needs the seller id.",
          { seller: s(), geocode: s(), zipcode: so(), countryName: so() },
        ),
        html: ready(
          "/plugin/amazon/",
          "Raw HTML of any Amazon URL with location targeting (url, geocode, and zipcode or countryName).",
          { url: s(), geocode: s(), zipcode: so(), countryName: so() },
        ),
      },
      { title: "Amazon", description: "Structured Amazon product, offer, search, deal, chart and seller data." },
    ),

    google: router(
      {
        search: ready(
          "/plugin/google/search",
          "Google search results as structured JSON: organic results, ads, knowledge graph, local results, related searches. start paginates by 10. Costs 10 credits.",
          { q: s(), start: no(), hl: so(), gl: so(), google_domain: so(), location: so(), device: so() },
        ),
        aiMode: ready(
          "/plugin/google/search/ai-mode",
          "Google AI Mode answer with references and shopping results. Costs 10 credits.",
          { q: s(), hl: so(), gl: so(), location: so(), device: so() },
        ),
        aiOverview: ready(
          "/plugin/google/search/ai-overview",
          "Resolve a deferred Google AI Overview using the session_key from a google.search response. Costs 5 credits.",
          { session_key: s() },
        ),
        mapsSearch: ready(
          "/plugin/google/maps/search",
          "Search Google Maps for places. ll pins the viewport (@lat,lng,zoom). start paginates by 20.",
          { q: s(), ll: so(), start: no(), hl: so(), gl: so(), google_domain: so() },
        ),
        mapsPlace: ready(
          "/plugin/google/maps/place",
          "Enriched Google Maps place details: menu, popular times, images, summaries. Give place_id (ChIJ...) or data_cid.",
          { place_id: so(), data_cid: so(), hl: so(), gl: so() },
        ),
        mapsReviews: ready(
          "/plugin/google/maps/reviews",
          "Paginated Google Maps reviews for a place. Give data_id (0x..:0x..) or place_id; continue with next_page_token. Optional sort, topic keyword and query filter.",
          { data_id: so(), place_id: so(), next_page_token: so(), num: no(), query: so(), hl: so(), gl: so() },
        ),
        shopping: ready(
          "/plugin/google/shopping",
          "Google Shopping product listings and sponsored ads with prices, retailers and ratings.",
          { q: s(), start: no(), hl: so(), gl: so(), google_domain: so(), currency: so() },
        ),
        shoppingProduct: ready(
          "/plugin/google/shopping/product",
          "Google Shopping product page: sellers with prices, shipping and totals, variants. Use catalog_id (with q) or immersive_product_page_token from a shopping result, or product_id for a compact response.",
          { catalog_id: so(), immersive_product_page_token: so(), product_id: so(), q: so(), hl: so(), gl: so() },
        ),
        shoppingProductStores: ready(
          "/plugin/google/shopping/product/stores",
          "Next batch of sellers for a Google Shopping product. Replay next_page_token verbatim with the same catalog_id.",
          { catalog_id: s(), next_page_token: s() },
        ),
        flights: ready(
          "/plugin/google/flights",
          "Google Flights itineraries with prices, durations, layovers, emissions and price insights. Dates are YYYY-MM-DD; return_date makes it a round trip.",
          { departure_id: s(), arrival_id: s(), outbound_date: s(), return_date: so(), type: no(), currency: so(), hl: so(), gl: so() },
        ),
        hotels: ready(
          "/plugin/google/hotels",
          "Google Hotels listings with ratings, amenities and prices. Use the form '<City> hotels' for q. Each property has a detail_token for hotelDetail.",
          { q: s(), check_in_date: s(), check_out_date: s(), next_page_token: so(), currency: so(), hl: so(), gl: so() },
        ),
        hotelDetail: ready(
          "/plugin/google/hotels/detail",
          "Per-vendor prices for one Google Hotels property, from a detail_token in a hotels response.",
          { detail_token: s(), check_in_date: s(), check_out_date: s(), currency: so() },
        ),
        news: ready(
          "/plugin/google/news",
          "Google News articles with bylines, ISO dates and publisher URLs, by keyword (q), topic or section token.",
          { q: so(), hl: so(), gl: so() },
        ),
        trends: ready(
          "/plugin/google/trends",
          "Google Trends for a keyword: interest over time, regional interest, related queries and topics. date such as 'today 12-m'.",
          { q: s(), geo: so(), hl: so(), date: so(), tz: so() },
        ),
        trending: ready(
          "/plugin/google/trending",
          "Currently trending Google searches by country (geo such as US). hours is 4, 24, 48 or 168.",
          { geo: s(), hl: so(), hours: no(), cat: no(), sort: so(), status: so() },
        ),
        food: ready(
          "/plugin/google/food",
          "Google Food order-online provider lists (pickup and delivery) for a restaurant query.",
          { q: s(), hl: so(), gl: so() },
        ),
        playStore: ready(
          "/plugin/google/play-store",
          "Search the Google Play Store for Android apps, or browse by category and chart.",
          { q: so(), next_page_token: so(), hl: so(), gl: so() },
        ),
        playStoreProduct: ready(
          "/plugin/google/play-store/product",
          "Google Play Store app details by package id, for example com.discord.",
          { product_id: s(), hl: so(), gl: so() },
        ),
        playStoreReviews: ready(
          "/plugin/google/play-store/reviews",
          "Paginated Google Play Store reviews for an app package id.",
          { product_id: s(), next_page_token: so(), hl: so(), gl: so() },
        ),
        youtube: ready(
          "/plugin/google/youtube",
          "YouTube search results: videos, channels, playlists, Shorts shelves, ads and related searches. Paginate with sp.",
          { search_query: s(), sp: so(), hl: so(), gl: so(), device: so() },
        ),
        youtubeVideo: ready(
          "/plugin/google/youtube/video",
          "YouTube video metadata with exact view and like counts, channel ids, related videos and comments. v is the 11-character video id; continue with next_page_token.",
          { v: s(), next_page_token: so(), hl: so(), gl: so() },
        ),
      },
      { title: "Google", description: "Structured Google Search, Maps, Shopping, Flights, Hotels, News, Trends, Play Store and YouTube data." },
    ),

    walmart: router(
      {
        search: ready(
          "/plugin/walmart/search",
          "Search a Walmart store's shelf. Give exactly one of store (id) or zipcode (US, 5 digits).",
          { q: s(), store: no(), zipcode: so() },
        ),
        product: ready(
          "/plugin/walmart/product",
          "One Walmart item's price, stock and specifications at a store. Give exactly one of store or zipcode.",
          { item: s(), store: no(), zipcode: so() },
        ),
        page: ready(
          "/plugin/walmart/store",
          "Fetch any walmart.com or walmart.ca URL through a session warmed for a store. On walmart.com pass zipcode and storeid together or neither; walmart.ca takes storeid only.",
          { url: s(), zipcode: so(), storeid: no() },
        ),
      },
      { title: "Walmart", description: "Store-scoped Walmart search, product and page data." },
    ),

    lowes: ready(
      "/plugin/lowes/store",
      "Fetch a lowes.com product, search or category page with store-level pricing and availability. url, zipcode (digits) and storeid are all required. Costs 10 credits.",
      { url: s(), zipcode: s(), storeid: s() },
    ),
    homedepot: router(
      {
        product: ready(
          "/plugin/homedepot/product",
          "A homedepot.com product page rendered for a specific store (HTML). Needs url, storeid and zipcode.",
          { url: s(), storeid: so(), zipcode: so() },
        ),
        stores: ready(
          "/plugin/homedepot/stores",
          "Home Depot stores near a zipcode or a lat/lng pair (JSON). Use the result's store ids with homedepot.product.",
          { zipcode: so(), lat: no(), lng: no() },
        ),
      },
      { title: "Home Depot", description: "Store-level Home Depot product pages and store lookup." },
    ),
    chatgpt: ready(
      "/plugin/chatgpt/chat",
      "Send one standalone prompt (max 1024 characters, no conversation memory) to ChatGPT and get the reply as structured JSON, with sources.",
      { q: s() },
    ),
    gemini: ready(
      "/plugin/gemini/chat",
      "Send one standalone prompt (max 4000 characters) to Google Gemini and get the reply as structured JSON.",
      { q: s() },
    ),

    async: router(
      {
        createJob: mutation(
          {
            description:
              "Create an asynchronous scraping job of up to 1000 targets. Give targets (URLs) with options such as Super, Render, GeoCode, or plugin ({ Key: 'google/search', Params: [{ q: '...' }, ...] }) for structured scraping, never both. Each entry becomes one task. Options use the API's capitalized names (Super, Render, GeoCode, Device, WebhookURL, WebhookHeaders, Timeout, ...) in options. Returns JobID and TaskIDs.",
            input: object({
              targets: array(string()).optional(),
              plugin: object({ Key: string(), Params: json() }).optional(),
              options: record(json()).optional(),
            }),
            approval: always(),
          },
          async (_ctx, { targets, plugin, options }) => {
            const list = targets;
            return queued("/jobs", {
              method: "POST",
              body: { ...options, ...(list === undefined ? {} : { Targets: list }), ...(plugin === undefined ? {} : { Plugin: plugin }) },
            });
          },
        ),
        listJobs: query(
          {
            description:
              "List async jobs, newest first. status is queuing, queued, pending, rotating, success, error or canceled; start_from and start_to are RFC3339 timestamps; sort is start_time_asc or start_time_desc.",
            input: object({
              page: no(),
              page_size: no(),
              status: so(),
              start_from: so(),
              start_to: so(),
              sort: so(),
            }),
          },
          async (_ctx, input) => queued("/jobs", { params: input }),
        ),
        getJob: query(
          { description: "Status and tasks of one async job.", input: object({ jobId: string({ minLength: 1 }) }) },
          async (_ctx, { jobId }) => queued(`/jobs/${encodeURIComponent(jobId)}`),
        ),
        getTask: query(
          {
            description: "Result of one task in an async job. Read it before its ExpiresAt time.",
            input: object({ jobId: string({ minLength: 1 }), taskId: string({ minLength: 1 }) }),
          },
          async (_ctx, { jobId, taskId }) => queued(`/jobs/${encodeURIComponent(jobId)}/${encodeURIComponent(taskId)}`),
        ),
        cancelJob: mutation(
          {
            description: "Cancel a running async job. A finished job cannot be canceled.",
            input: object({ jobId: string({ minLength: 1 }) }),
            approval: always(),
          },
          async (_ctx, { jobId }) => queued(`/jobs/${encodeURIComponent(jobId)}`, { method: "DELETE" }),
        ),
        me: query(
          { description: "Async API account information, including free async concurrency.", input: object({}) },
          async () => queued("/me"),
        ),
      },
      { title: "Async API", description: "Batch scraping jobs of up to 1000 targets, polled or sent to a webhook." },
    ),
  });
};

export default defineApp({ user: { accounts: { scrapedo: scrapedo.many() } }, icons }, async ({ user, fetch, signal }) => ({
  tools: router(await accountRouter(user?.accounts.scrapedo ?? [], (account) => scrapedoTools(account, fetch, signal), { signal }), {
    title: "Scrape.do",
    description:
      "Scrape any web page through anti-bot proxies and headless browsers, get structured Amazon, Google, Walmart, Home Depot and Lowe's data, and run async batch jobs.",
    icons,
  }),
}));
