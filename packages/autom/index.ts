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

const base = "https://api.autom.dev";

const autom = defineProvider({
  name: "Autom",
  hosts: ["api.autom.dev"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // /v1/usage is free and never consumes credits.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1/usage`, { headers: { "x-api-key": account.fields.token }, signal });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

// Autom authenticates with an x-api-key header. Every endpoint is a GET.
function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, params: Params = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), { headers: { "x-api-key": token }, signal });
    return decodeJson(response, json());
  };
}

// tool name, path, credits, description (with the endpoint's optional parameters)
const endpoints: readonly [string, string, number, string][] = [
  ["googleSearch", "/v1/google/search", 1, "Google web search with pagination: organic results, knowledge graph. Optional params: page, num, gl, hl, location (or uule, not both), tbs (time filter such as qdr:w), safe."],
  ["googleSearchLight", "/v1/google/search/light", 1, "Lighter, faster Google web search. Optional params: gl, hl."],
  ["googleAiMode", "/v1/google/search/ai", 3, "Google AI Mode answer to a question. Optional params: gl, hl, location (or uule, not both)."],
  ["googleSearchAutocomplete", "/v1/google/search/autocomplete", 1, "Google search suggestions for a partial query. Optional params: cp (cursor position), gl, hl."],
  ["googleImages", "/v1/google/images", 1, "Google Images results. Optional params: page, gl, hl, google_domains (such as google.fr), safe."],
  ["googleVideos", "/v1/google/videos", 1, "Google Videos results. Params: page (required by the API; 1 is the first page), num, gl, hl, location (or uule), safe."],
  ["googleNews", "/v1/google/news", 1, "Google News results. Optional params: page, num, gl, hl."],
  ["googleShopping", "/v1/google/shopping", 1, "Google Shopping product results. Optional params: page, gl, hl, location (or uule), safe."],
  ["googleJobs", "/v1/google/jobs", 1, "Google Jobs listings. Optional params: location (or uule), gl, hl, lrad (radius km), ltype (1 for remote), uds, next_page_token."],
  ["googleMaps", "/v1/google/maps", 1, "Google Maps place search. Optional params: page, gl, hl, ll (for example @43.51,1.46,60m)."],
  ["bingSearch", "/v1/bing/search", 1, "Bing web search. Optional params: page, num, location, lat, lon, mkt (such as en-US) or cc (not both)."],
  ["braveSearch", "/v1/brave/search", 1, "Brave web search. Optional params: page, gl, hl, safe (active, off, moderate, strict)."],
  ["braveImages", "/v1/brave/images", 1, "Brave Images results (50 per page). Optional params: page, gl, hl, safe."],
  ["braveVideos", "/v1/brave/videos", 1, "Brave Videos results. Optional params: page, gl, hl, safe."],
];

// Lookup endpoints that take only a filter string and cost nothing.
const finders: readonly [string, string, string][] = [
  ["countries", "/v1/finder/google-countries", "Find Google country codes by code or name (case-insensitive). Free."],
  ["languages", "/v1/finder/google-languages", "Find Google language codes by name (case-insensitive). Free."],
  ["locations", "/v1/finder/google-locations", "Find supported search locations (cities, countries) by name, ordered by reach. Free."],
];

function build(call: ReturnType<typeof client>) {
  const searchTools = Object.fromEntries(
    endpoints.map(([name, path, credits, description]) => [
      name,
      query(
        {
          description: `${description} Costs ${credits} credit${credits === 1 ? "" : "s"} per successful call.`,
          input: object({ query: string({ minLength: 1 }), params: record(json()).optional() }),
        },
        async (_ctx, { query: text, params }) => call(path, { ...(params ?? {}), query: text }),
      ),
    ]),
  );

  const finderTools = Object.fromEntries(
    finders.map(([name, path, description]) => [
      name,
      query(
        { description, input: object({ query: string({ minLength: 1 }) }) },
        async (_ctx, { query: text }) => call(path, { query: text }),
      ),
    ]),
  );

  return router({
    ...searchTools,
    finder: router(finderTools, { title: "Finders", description: "Look up country, language and location values for search parameters." }),
    usage: query(
      {
        description: "Remaining quota across subscription, packs and credits, rate limits and API key details. Free.",
        input: object({}),
      },
      async () => call("/v1/usage"),
    ),
    stats: query(
      {
        description:
          "Platform-wide infrastructure health for the last hour (not your account usage). Provide engine (such as google) or path (such as /v1/google/search). Free; returns 403 unless Stats is enabled on the account.",
        input: object({ engine: string().optional(), path: string().optional() }),
      },
      async (_ctx, { engine, path }) => call("/v1/stats", { engine, path }),
    ),
  });
}

export default defineApp(
  { user: { accounts: { autom: autom.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.autom ?? [], (account) => build(client(account.fields.token, fetch, signal)), { signal }),
      {
        title: "Autom",
        description:
          "Fast structured SERP data from Google (web, AI Mode, images, videos, news, shopping, jobs, maps, autocomplete), Bing and Brave, plus usage and location finders.",
        icons,
      },
    ),
  }),
);
