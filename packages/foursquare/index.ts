import {
  accountRouter,
  boolean,
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

const base = "https://places-api.foursquare.com";
const apiVersion = "2025-06-17";

const foursquare = defineProvider({
  name: "Foursquare",
  hosts: ["places-api.foursquare.com"],
  auth: {
    apiKey: secrets({
      label: "Service API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Foursquare has no account endpoint, so health runs a one-result search by field id only.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/places/search?ll=41.8781,-87.6298&limit=1&fields=fsq_place_id`, {
      signal,
      headers: headers(account.fields.token),
    });
    await decodeJson(response, object({}));
  },
});

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, Accept: "application/json", "X-Places-Api-Version": apiVersion };
}

type Params = Record<string, unknown>;

function client(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  return {
    get: async (path: string, params: Params = {}) => {
      const url = new URL(`${base}${path}`);
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
      return decodeJson(await fetcher(url.toString(), { signal, headers: headers(token) }), json());
    },
  };
}

const fields = string().optional();
const limit = number().optional();
const ll = string().optional();

export default defineApp(
  { user: { accounts: { foursquare: foursquare.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.foursquare ?? [],
        (account) => {
          const c = client(account.fields.token, fetch, signal);
          return router({
            places: router({
              search: query(
                {
                  description:
                    "Search places by free text, category, chain, price, hours and location. Give ll (lat,lng) with radius, or near (a locality name), or ne and sw (bounding box); without them Foursquare uses the caller's IP. fsq_category_ids and fsq_chain_ids are comma-separated; sort is RELEVANCE, RATING, DISTANCE or POPULARITY; open_at is DOWTHHMM such as 1T2130 (Monday 21:30) and cannot be combined with open_now; exclude_fsq_chain_ids cannot be combined with exclude_all_chains; price is 1 to 4; limit 1 to 50. fields is a comma-separated list of response fields.",
                  input: object({
                    query: string().optional(),
                    ll,
                    radius: number().optional(),
                    near: string().optional(),
                    ne: string().optional(),
                    sw: string().optional(),
                    fsq_category_ids: string().optional(),
                    fsq_chain_ids: string().optional(),
                    exclude_fsq_chain_ids: string().optional(),
                    exclude_all_chains: boolean().optional(),
                    min_price: number().optional(),
                    max_price: number().optional(),
                    open_now: boolean().optional(),
                    open_at: string().optional(),
                    tel_format: string().optional(),
                    sort: string().optional(),
                    limit,
                    fields,
                  }),
                },
                async (_ctx, input) => c.get("/places/search", input),
              ),
              ask: query(
                {
                  description:
                    "Natural-language place search, e.g. query \"best cocktail lounge in Williamsburg\". Needs a search area: a place named in query, ll (lat,lng), or location (a geocodable locality such as Chicago, IL). context describes preferences (e.g. traveling with kids, need outdoor seating). fields is a comma-separated list of response fields.",
                  input: object({
                    query: string({ minLength: 1 }),
                    ll,
                    location: string().optional(),
                    context: string().optional(),
                    fields,
                  }),
                },
                async (_ctx, input) => c.get("/places/ask", input),
              ),
              get: query(
                {
                  description:
                    "Details for one place by fsq_place_id. fields is a comma-separated list of response fields; omit for all Pro fields.",
                  input: object({ fsq_place_id: string({ minLength: 1 }), fields }),
                },
                async (_ctx, { fsq_place_id, fields }) =>
                  c.get(`/places/${encodeURIComponent(fsq_place_id)}`, { fields }),
              ),
              photos: query(
                {
                  description:
                    "Photos for a place. sort is popular (default) or newest; classifications is a comma-separated filter (food_or_drink, menu, outdoor, indoor_general, logos, product...); limit 1 to 50 (default 10). A photo URL is prefix + size + suffix.",
                  input: object({
                    fsq_place_id: string({ minLength: 1 }),
                    sort: string().optional(),
                    classifications: string().optional(),
                    limit,
                  }),
                },
                async (_ctx, { fsq_place_id, ...rest }) =>
                  c.get(`/places/${encodeURIComponent(fsq_place_id)}/photos`, rest),
              ),
              tips: query(
                {
                  description:
                    "Tips (short reviews) for a place. sort is popular (default) or newest; fields may include fsq_tip_id, created_at, text, lang, url, agree_count, disagree_count, photo; limit up to 50.",
                  input: object({
                    fsq_place_id: string({ minLength: 1 }),
                    sort: string().optional(),
                    fields,
                    limit,
                  }),
                },
                async (_ctx, { fsq_place_id, ...rest }) =>
                  c.get(`/places/${encodeURIComponent(fsq_place_id)}/tips`, rest),
              ),
              match: query(
                {
                  description:
                    "Find the Foursquare place matching a name and address. cc is a two-letter country code (English-speaking countries only). Supply ll when the address cannot be resolved.",
                  input: object({
                    name: string({ minLength: 1 }),
                    address: string({ minLength: 1 }),
                    city: string({ minLength: 1 }),
                    cc: string({ minLength: 2 }),
                    state: string().optional(),
                    postal_code: string().optional(),
                    ll,
                    fields,
                  }),
                },
                async (_ctx, input) => c.get("/places/match", input),
              ),
            }),
            autocomplete: query(
              {
                description:
                  "Autocomplete places, geographies and searches from a partial query (3+ characters). types is any of place, search, geo (comma-separated); bias favors one type; session_token groups requests into one billing session.",
                input: object({
                  query: string({ minLength: 3 }),
                  ll,
                  radius: number().optional(),
                  types: string().optional(),
                  bias: string().optional(),
                  session_token: string().optional(),
                  limit,
                }),
              },
              async (_ctx, input) => c.get("/autocomplete", input),
            ),
            geotagging: router({
              candidates: query(
                {
                  description:
                    "Nearby place candidates for a device location (Snap to Place), including lower-quality results Place Search omits. hacc is horizontal accuracy in meters; query matches place names.",
                  input: object({
                    ll,
                    hacc: number().optional(),
                    altitude: number().optional(),
                    query: string().optional(),
                    limit,
                    fields,
                  }),
                },
                async (_ctx, input) => c.get("/geotagging/candidates", input),
              ),
            }),
          });
        },
        { signal },
      ),
      {
        title: "Foursquare",
        description:
          "Foursquare Places: search and look up places worldwide, with details, photos, tips, autocomplete, geotagging candidates and name/address matching.",
        icons,
      },
    ),
  }),
);
