import {
  accountRouter,
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

const base = "https://api.coinmarketcal.com/v2";

const coinmarketcal = defineProvider({
  name: "CoinMarketCal",
  hosts: ["api.coinmarketcal.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /v2/categories is a small, always-available lookup list that every plan can read.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/categories`, { signal, headers: { "x-api-key": account.fields.token } });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return {
    get: async (path: string, params: Record<string, string | number | undefined> = {}) => {
      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== "") search.set(key, String(value));
      }
      const qs = search.toString();
      const response = await fetcher(`${base}${path}${qs ? `?${qs}` : ""}`, {
        signal,
        headers: { "x-api-key": token, Accept: "application/json" },
      });
      return decodeJson(response, json());
    },
  };
}

function build(api: ReturnType<typeof client>) {
  return router({
    events: router(
      {
        list: query(
          {
            description:
              "List crypto events, soonest first by default. Filters combine with AND. coins: comma-separated coin slugs (bitcoin,ethereum; see coins.list). categories: comma-separated category ids (Standard plan and above). from/to: dates as YYYY-MM-DD (ISO 8601 calendar date); when omitted the API applies its own default window. keyword searches title and description. impactMin: minimum impact score 0.0-10.0 (Elite plan and above). sortBy: sort key as accepted by the API (not verified against vendor docs; leave unset for the default order). limit: positive integer page size. Paginate by passing the cursor from the response meta.",
            input: object({
              coins: string().optional(),
              categories: string().optional(),
              from: string().optional(),
              to: string().optional(),
              keyword: string().optional(),
              impactMin: number().optional(),
              sortBy: string().optional(),
              limit: number().optional(),
              cursor: string().optional(),
            }),
          },
          async (_ctx, input) => api.get("/events", input),
        ),
        get: query(
          { description: "Get one event by its id.", input: object({ id: string({ minLength: 1 }) }) },
          async (_ctx, { id }) => api.get(`/events/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Events", description: "Search and read crypto events." },
    ),
    coins: query(
      {
        description: "List coins with their canonical slugs. Use the slug (not the ticker, which can collide) in events.list's coins filter.",
        input: object({}),
      },
      async () => api.get("/coins"),
    ),
    categories: query(
      {
        description: "List event categories and their ids, for events.list's categories filter. The list rarely changes.",
        input: object({}),
      },
      async () => api.get("/categories"),
    ),
  });
}

export default defineApp(
  { user: { accounts: { coinmarketcal: coinmarketcal.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.coinmarketcal ?? [], (account) => build(client(account.fields.token, fetch, signal)), {
        signal,
      }),
      {
        title: "CoinMarketCal",
        description: "Track upcoming and past crypto events: search by coin, category, date and keyword, plus coins and categories.",
        icons,
      },
    ),
  }),
);
