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
import { engines } from "./engines.js";
import { icons } from "./icon.js";

const base = "https://www.searchapi.io";

const searchapi = defineProvider({
  name: "SearchApi",
  hosts: ["www.searchapi.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/api/v1/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

// SearchApi accepts the key as a Bearer header. Every call here is a read.
function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, params: Params = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), { signal, headers: { Authorization: `Bearer ${token}` } });
    return decodeJson(response, json());
  };
}

function build(call: ReturnType<typeof client>) {
  const engineTools = Object.fromEntries(
    engines.map(([engine, name]) => [
      name,
      query(
        {
          description: `Run the SearchApi "${engine}" engine. Put the engine's parameters (q, location, gl, hl, page, ...) in params; see https://www.searchapi.io/docs for each engine. Each search consumes credits.`,
          input: object({ params: record(json()).optional() }),
        },
        async (_ctx, { params }) => call("/api/v1/search", { ...(params ?? {}), engine }),
      ),
    ]),
  );

  return router({
    search: query(
      {
        description:
          "Run any SearchApi engine by id (google, bing, youtube, amazon_search, google_maps, ...) with that engine's parameters in params. Prefer an engine-specific tool when one exists.",
        input: object({ engine: string({ minLength: 1 }), params: record(json()).optional() }),
      },
      async (_ctx, { engine, params }) => call("/api/v1/search", { ...(params ?? {}), engine }),
    ),
    ...engineTools,
    account: query(
      { description: "Current-month usage, remaining credits and hourly rate limit.", input: object({}) },
      async () => call("/api/v1/me"),
    ),
    locations: query(
      {
        description: "Look up supported location names for the location parameter. q is the search term (for example \"new york\"). limit defaults to 10, maximum 100.",
        input: object({ q: string({ minLength: 1 }), limit: number().optional() }),
      },
      async (_ctx, { q, limit }) => call("/api/v1/locations", { q, limit }),
    ),
    searchHistory: router(
      {
        get: query(
          {
            description:
              "Retrieve the stored JSON result of a past search by its search id (for example search_abc123, from search_metadata.id or searchHistory.list). Uses the public search link /api/v1/public_search/{id}.json; only successful searches from the last 90 days have one.",
            input: object({ searchId: string({ minLength: 1 }) }),
          },
          async (_ctx, { searchId }) => call(`/api/v1/public_search/${encodeURIComponent(searchId)}.json`),
        ),
        list: query(
          {
            description:
              "List past searches from the last 90 days (free to call). limit defaults to 20, maximum 100. engine filters by engine id (google, bing, ...). time_period_min and time_period_max are dates like 2024-10-01. Pass pagination.next_page_token from the previous response as next_page_token for the next page.",
            input: object({
              limit: number().optional(),
              engine: string().optional(),
              time_period_min: string().optional(),
              time_period_max: string().optional(),
              next_page_token: string().optional(),
            }),
          },
          async (_ctx, params) => call("/api/v1/search_history", params),
        ),
      },
      { title: "Search history", description: "Past searches stored by SearchApi." },
    ),
    searchAnalytics: query(
      {
        description:
          "Aggregated search usage analytics (free to call, looks back one year). Requires a Scale plan or higher. Optional params: engine (engine id or all, default all), bucket (daily or hourly, default daily), time_period (last_day, last_week, last_month, last_6_months or last_year; overrides min/max), time_period_min and time_period_max (date like 2024-10-01 or RFC 3339 datetime; default last month to today).",
        input: object({ params: record(json()).optional() }),
      },
      async (_ctx, { params }) => call("/api/v1/search_analytics", params ?? {}),
    ),
  });
}

export default defineApp(
  { user: { accounts: { searchapi: searchapi.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.searchapi ?? [], (account) => build(client(account.fields.token, fetch, signal)), { signal }),
      {
        title: "SearchApi",
        description:
          "Real-time structured search results from Google, Bing, YouTube, Amazon, Walmart, TikTok, Airbnb and 140+ other engines, plus account usage, locations and search history.",
        icons,
      },
    ),
  }),
);
