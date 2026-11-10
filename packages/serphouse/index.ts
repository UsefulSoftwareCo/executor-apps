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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.serphouse.com";

const serphouse = defineProvider({
  name: "SERPHouse",
  hosts: ["api.serphouse.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Reads plan and credit usage.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/account/info`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

// SERPHouse can answer HTTP 200 with {"status":"error","msg":"..."}; surface that as a failure.
const failOnErrorBody = (value: unknown): unknown => {
  if (typeof value === "object" && value !== null && (value as { status?: unknown }).status === "error") {
    const msg = (value as { msg?: unknown }).msg;
    throw new Error(`SERPHouse error: ${typeof msg === "string" ? msg : JSON.stringify(value)}`);
  }
  return value;
};

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const locNote =
  "Provide loc (a name such as 'New York,New York,United States') or loc_id (from locations.search), not both.";
const dateNote =
  "date_range limits by time: h (hour), d (day), w (week), m (month), y (year) or 'YYYY-MM-DD,YYYY-MM-DD'.";

const serphouseTools = (account: Account, signal: AbortSignal) => {
  const post = (path: string, body: unknown) => async (fetch: typeof globalThis.fetch) =>
    failOnErrorBody(await decodeJson(
      await fetch(`${base}${path}`, {
        method: "POST",
        signal,
        headers: { ...headers(account), "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      json(),
    ));
  const get = (path: string, params: Record<string, string | number | undefined> = {}) =>
    async (fetch: typeof globalThis.fetch) => {
      const qs = search(params);
      return failOnErrorBody(await decodeJson(await fetch(`${base}${path}${qs ? `?${qs}` : ""}`, { signal, headers: headers(account) }), json()));
    };

  const device = string();
  const sharedGoogle = {
    q: string(),
    domain: string(),
    lang: string(),
    loc: string().optional(),
    loc_id: number().optional(),
  };

  const task = object({
    q: string(),
    domain: string(),
    lang: string(),
    device: string(),
    serp_type: string(),
    loc: string().optional(),
    loc_id: number().optional(),
    page: number().optional(),
    num_result: number().optional(),
    verbatim: number().optional(),
    gfilter: number().optional(),
    date_range: string().optional(),
    postback_url: string().optional(),
    pingback_url: string().optional(),
  });

  return router({
    google: router(
      {
        web: query(
          {
            description: `Google web search (structured organic results, ads, knowledge panel, People Also Ask, related searches and more). domain is a Google domain such as google.com, device is desktop or mobile, lang a code such as en. ${locNote} num_result is 1-10; verbatim and gfilter are 0 or 1. ${dateNote} Costs credits.`,
            input: object({
              ...sharedGoogle,
              device,
              page: number().optional(),
              num_result: number().optional(),
              verbatim: number().optional(),
              gfilter: number().optional(),
              date_range: string().optional(),
            }),
          },
          async ({ fetch }, input) => post("/google-web", input)(fetch),
        ),
        lite: query(
          {
            description: `Fast, lightweight Google organic results. Provide either loc or gl (a two-letter ISO country code such as US). ${dateNote} Costs credits.`,
            input: object({
              q: string(),
              domain: string(),
              lang: string(),
              gl: string().optional(),
              loc: string().optional(),
              page: number().optional(),
              date_range: string().optional(),
              verbatim: number().optional(),
            }),
          },
          async ({ fetch }, input) => post("/web-search-lite", input)(fetch),
        ),
        news: query(
          {
            description: `Google News results. ${locNote} ${dateNote} Costs credits.`,
            input: object({ ...sharedGoogle, device, page: number().optional(), date_range: string().optional() }),
          },
          async ({ fetch }, input) => post("/google-news", input)(fetch),
        ),
        images: query(
          {
            description: `Google Images results. ${locNote} ${dateNote} Costs credits.`,
            input: object({ ...sharedGoogle, page: number().optional(), date_range: string().optional() }),
          },
          async ({ fetch }, input) => post("/google-image", input)(fetch),
        ),
        shopping: query(
          {
            description: `Google Shopping results. ${locNote} Costs credits.`,
            input: object({ ...sharedGoogle, page: number().optional() }),
          },
          async ({ fetch }, input) => post("/google-shop", input)(fetch),
        ),
        local: query(
          {
            description: `Google Local (map pack) results, up to 20 per page. Each result carries a place_details_id for google.placeDetails. ${locNote} Costs credits.`,
            input: object({ ...sharedGoogle, page: number().optional() }),
          },
          async ({ fetch }, input) => post("/google-local-api", input)(fetch),
        ),
        placeDetails: query(
          {
            description:
              "Details for one Google place (address, hours, rating, reviews summary), by place_details_id from google.local results. Costs credits.",
            input: object({ place_details_id: string(), lang: string().optional() }),
          },
          async ({ fetch }, input) => post("/google-place-details-api", input)(fetch),
        ),
        jobs: query(
          {
            description: `Google Jobs listings for a query. ${locNote} ${dateNote} Costs credits.`,
            input: object({ ...sharedGoogle, date_range: string().optional() }),
          },
          async ({ fetch }, input) => post("/google-jobs-api", input)(fetch),
        ),
        forums: query(
          {
            description: `Google Forums (discussions) results. ${locNote} ${dateNote} Costs credits.`,
            input: object({
              ...sharedGoogle,
              device,
              page: number().optional(),
              date_range: string().optional(),
              verbatim: number().optional(),
            }),
          },
          async ({ fetch }, input) => post("/google-forums-api", input)(fetch),
        ),
        videos: query(
          {
            description: `Google Videos results. video_duration is short (0-4 min), medium (4-20 min) or long (20+ min); video_quality and video_captions filter further. ${locNote} ${dateNote} Costs credits.`,
            input: object({
              ...sharedGoogle,
              device,
              page: number().optional(),
              date_range: string().optional(),
              video_duration: string().optional(),
              video_quality: string().optional(),
              video_captions: string().optional(),
            }),
          },
          async ({ fetch }, input) => post("/google-videos-api", input)(fetch),
        ),
        shortVideos: query(
          {
            description: `Google Short Videos results. ${locNote} ${dateNote} Costs credits.`,
            input: object({
              ...sharedGoogle,
              device,
              page: number().optional(),
              date_range: string().optional(),
              video_quality: string().optional(),
              video_captions: string().optional(),
            }),
          },
          async ({ fetch }, input) => post("/google-short-videos-api", input)(fetch),
        ),
        autocomplete: query(
          {
            description:
              "Google Autocomplete suggestions for a partial query. client is chrome (default), chrome-omni, home_page, safari, firefox or youtube. Costs credits.",
            input: object({
              q: string(),
              lang: string().optional(),
              loc: string().optional(),
              client: string().optional(),
            }),
          },
          async ({ fetch }, input) => post("/google-autocomplete-api", input)(fetch),
        ),
        top100: query(
          {
            description: `Live Google SERP with up to 100 results by fetching max_pages result pages (1-10, default 10); credits are charged per page. ${locNote} ${dateNote}`,
            input: object({
              ...sharedGoogle,
              device,
              max_pages: number().optional(),
              verbatim: number().optional(),
              gfilter: number().optional(),
              date_range: string().optional(),
            }),
          },
          async ({ fetch }, input) => post("/serp/google_advanced", input)(fetch),
        ),
        scheduleTop100: mutation(
          {
            description: `Queue a Google top-100 SERP task. Returns a task id; fetch it with tasks.status and tasks.get, or provide postback_url (results POSTed) or pingback_url (GET notification). Credits for max_pages (1-10) are reserved up front and unused pages are refunded. ${locNote} ${dateNote}`,
            input: object({
              ...sharedGoogle,
              device,
              max_pages: number().optional(),
              verbatim: number().optional(),
              gfilter: number().optional(),
              date_range: string().optional(),
              postback_url: string().optional(),
              pingback_url: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) => post("/serp/google_advanced_scheduled", input)(fetch),
        ),
      },
      { title: "Google", description: "Google web, news, images, shopping, local, jobs, forums, videos and autocomplete." },
    ),
    bing: router(
      {
        web: query(
          {
            description: `Bing web search. lang uses a locale such as en-US. device is desktop or mobile. ${locNote} ${dateNote} Costs credits.`,
            input: object({
              q: string(),
              lang: string(),
              device,
              loc: string().optional(),
              loc_id: number().optional(),
              page: number().optional(),
              date_range: string().optional(),
            }),
          },
          async ({ fetch }, input) => post("/bing-web", input)(fetch),
        ),
        news: query(
          {
            description: `Bing News results. lang uses a locale such as en-US. ${locNote} Costs credits.`,
            input: object({
              q: string(),
              lang: string(),
              device,
              loc: string().optional(),
              loc_id: number().optional(),
              page: number().optional(),
            }),
          },
          async ({ fetch }, input) => post("/bing-news", input)(fetch),
        ),
        images: query(
          {
            description: `Bing Images results. lang uses a locale such as en-US. ${locNote} Costs credits.`,
            input: object({
              q: string(),
              lang: string(),
              loc: string().optional(),
              loc_id: number().optional(),
              page: number().optional(),
            }),
          },
          async ({ fetch }, input) => post("/bing-image", input)(fetch),
        ),
      },
      { title: "Bing", description: "Bing web, news and image search." },
    ),
    yahoo: router(
      {
        web: query(
          {
            description:
              "Yahoo web search. domain is a regional Yahoo domain such as us.yahoo.com or uk.yahoo.com (see domains.list); lang uses a code such as lang_en. No location needed. Costs credits.",
            input: object({ q: string(), domain: string(), lang: string(), device, page: number().optional() }),
          },
          async ({ fetch }, input) => post("/yahoo-web", input)(fetch),
        ),
        news: query(
          {
            description:
              "Yahoo News results. domain is a regional Yahoo domain; lang uses a code such as lang_en. Costs credits.",
            input: object({ q: string(), domain: string(), lang: string(), device, page: number().optional() }),
          },
          async ({ fetch }, input) => post("/yahoo-news", input)(fetch),
        ),
        images: query(
          {
            description:
              "Yahoo Images results. domain is a regional Yahoo domain; lang uses a code such as lang_en. Costs credits.",
            input: object({ q: string(), domain: string(), lang: string(), page: number().optional() }),
          },
          async ({ fetch }, input) => post("/yahoo-image", input)(fetch),
        ),
      },
      { title: "Yahoo", description: "Yahoo web, news and image search." },
    ),
    serp: query(
      {
        description: `Generic live SERP for Google, Bing or Yahoo through one endpoint. domain is google.com, bing.com or a Yahoo domain; serp_type is web, news, image or shop (shop is Google only); device is desktop or mobile. ${locNote} ${dateNote} Costs credits.`,
        input: object({
          q: string(),
          domain: string(),
          lang: string(),
          device,
          serp_type: string(),
          loc: string().optional(),
          loc_id: number().optional(),
          page: number().optional(),
          num_result: number().optional(),
          verbatim: number().optional(),
          gfilter: number().optional(),
          date_range: string().optional(),
        }),
      },
      async ({ fetch }, input) => post("/serp/live", input)(fetch),
    ),
    scrape: query(
      {
        description:
          "Fetch and render a web page and return its content. device is desktop or mobile. Credits depend on the site: 1 for general sites, 5 for ecommerce, 10 for social media.",
        input: object({ url: string(), device }),
      },
      async ({ fetch }, input) => post("/scrape", input)(fetch),
    ),
    tasks: router(
      {
        schedule: mutation(
          {
            description:
              "Queue up to 100 SERP tasks in one request (recommended maximum). Each task has the same fields as serp, plus optional postback_url (results POSTed) and pingback_url (GET notification). Returns task ids; fetch them with tasks.status and tasks.get.",
            input: object({ tasks: array(task) }),
            approval: always(),
          },
          async ({ fetch }, { tasks }) => post("/serp/schedule", tasks)(fetch),
        ),
        status: query(
          {
            description: "Check whether a queued SERP task (from tasks.schedule or google.scheduleTop100) has completed.",
            input: object({ id: string() }),
          },
          async ({ fetch }, input) => get("/serp/check", input)(fetch),
        ),
        get: query(
          {
            description: "Fetch the result of a completed queued SERP task by its id.",
            input: object({ id: string() }),
          },
          async ({ fetch }, input) => get("/serp/get", input)(fetch),
        ),
      },
      { title: "Tasks", description: "Queue SERP jobs and collect their results." },
    ),
    account: router(
      {
        info: query(
          { description: "Account email, name, active plan and credit totals.", input: object({}) },
          async ({ fetch }) => get("/account/info")(fetch),
        ),
      },
      { title: "Account", description: "Plan and credit usage." },
    ),
    domains: router(
      {
        list: query(
          {
            description: "Search engine domains supported by the SERP API (Google, Bing and regional Yahoo domains).",
            input: object({}),
          },
          async ({ fetch }) => get("/domain/list")(fetch),
        ),
      },
      { title: "Domains", description: "Supported search engine domains." },
    ),
    languages: router(
      {
        list: query(
          {
            description: "Language codes accepted by SERP requests for one engine. type is google, bing or yahoo.",
            input: object({ type: string() }),
          },
          async ({ fetch }, { type }) => get(`/language/list/${encodeURIComponent(type)}`)(fetch),
        ),
      },
      { title: "Languages", description: "Supported language codes." },
    ),
    locations: router(
      {
        search: query(
          {
            description:
              "Search the location database for valid loc names and loc_id values. type is google or bing (their location lists differ).",
            input: object({ q: string(), type: string() }),
          },
          async ({ fetch }, input) => get("/location/search", input)(fetch),
        ),
      },
      { title: "Locations", description: "Geographic targets for SERP requests." },
    ),
  });
};

export default defineApp({ user: { accounts: { serphouse: serphouse.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.serphouse ?? [], (account) => serphouseTools(account, signal), { signal }), {
    title: "SERPHouse",
    description:
      "Real-time and batch SERP data from Google, Bing and Yahoo: web, news, images, shopping, local, jobs and videos, plus a page scraper and account credits.",
    icons,
  }),
}));
