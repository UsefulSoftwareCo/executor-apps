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

const base = "https://api.yelp.com";

const yelp = defineProvider({
  name: "Yelp",
  hosts: ["api.yelp.com"],
  auth: {
    apiKey: secrets({
      label: "Yelp Fusion API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Yelp has no current-user endpoint; a category lookup is the cheapest read that checks the key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v3/categories/restaurants`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

type Params = Record<string, unknown>;
type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = { Authorization: `Bearer ${token}` };
  const path = (value: string) => encodeURIComponent(value);
  return {
    path,
    get: async (route: string, params: Params = {}) => {
      const url = new URL(`${base}${route}`);
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
      return decodeJson(await fetcher(url.toString(), { signal, headers }), json());
    },
    post: async (route: string, body: Params) =>
      decodeJson(
        await fetcher(`${base}${route}`, {
          method: "POST",
          signal,
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
        json(),
      ),
  };
}

const place = {
  location: string().optional(),
  latitude: number().optional(),
  longitude: number().optional(),
};
const paging = { limit: number().optional(), offset: number().optional() };
const locale = { locale: string().optional() };

export default defineApp(
  { user: { accounts: { yelp: yelp.many() } }, icons },
  async ({ user, signal, fetch }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.yelp ?? [],
        (account) => {
          const c = client(account.fields.token, fetch, signal);
          return router({
            businesses: router(
              {
                search: query(
                  {
                    description:
                      "Search businesses. Give location (text) or both latitude and longitude. categories is a comma-separated list of category aliases, price a comma-separated list of 1-4, sortBy one of best_match, rating, review_count, distance, radius in meters (max 40000), limit up to 50 (max 240 results total).",
                    input: object({
                      ...place,
                      ...paging,
                      ...locale,
                      term: string().optional(),
                      radius: number().optional(),
                      categories: string().optional(),
                      price: string().optional(),
                      openNow: boolean().optional(),
                      openAt: number().optional(),
                      attributes: string().optional(),
                      sortBy: string().optional(),
                    }),
                  },
                  async (_ctx, i) =>
                    c.get("/v3/businesses/search", {
                      location: i.location,
                      latitude: i.latitude,
                      longitude: i.longitude,
                      term: i.term,
                      radius: i.radius,
                      categories: i.categories,
                      locale: i.locale,
                      price: i.price,
                      open_now: i.openNow,
                      open_at: i.openAt,
                      attributes: i.attributes,
                      sort_by: i.sortBy,
                      limit: i.limit,
                      offset: i.offset,
                    }),
                ),
                searchByPhone: query(
                  {
                    description: "Find businesses by phone number in international format, e.g. +14159083801.",
                    input: object({ phone: string({ minLength: 1 }), ...locale }),
                  },
                  async (_ctx, i) => c.get("/v3/businesses/search/phone", i),
                ),
                match: query(
                  {
                    description:
                      "Match a known business (name plus address) to its Yelp business. country is a two-letter uppercase ISO 3166-1 alpha-2 code, state an ISO 3166-2 code (max 3 characters), address1 is required (pass an empty string for service businesses with no street address), postalCode max 12 characters, limit 1-10 (default 3), matchThreshold one of none, default, strict.",
                    input: object({
                      name: string({ minLength: 1 }),
                      city: string({ minLength: 1 }),
                      state: string({ minLength: 1 }),
                      country: string({ minLength: 2 }),
                      address1: string(),
                      address2: string().optional(),
                      address3: string().optional(),
                      latitude: number().optional(),
                      longitude: number().optional(),
                      phone: string().optional(),
                      postalCode: string().optional(),
                      yelpBusinessId: string().optional(),
                      limit: number().optional(),
                      matchThreshold: string().optional(),
                    }),
                  },
                  async (_ctx, i) => {
                    if (!/^[A-Z]{2}$/.test(i.country)) throw new Error("country must be two uppercase letters, e.g. US");
                    if (i.state.length > 3) throw new Error("state must be at most 3 characters");
                    if (i.postalCode !== undefined && i.postalCode.length > 12) throw new Error("postalCode must be at most 12 characters");
                    if (i.limit !== undefined && (i.limit < 1 || i.limit > 10)) throw new Error("limit must be between 1 and 10");
                    if (i.matchThreshold !== undefined && !["none", "default", "strict"].includes(i.matchThreshold))
                      throw new Error("matchThreshold must be none, default or strict");
                    return c.get("/v3/businesses/matches", {
                      name: i.name,
                      city: i.city,
                      state: i.state,
                      country: i.country,
                      address1: i.address1,
                      address2: i.address2,
                      address3: i.address3,
                      latitude: i.latitude,
                      longitude: i.longitude,
                      phone: i.phone,
                      postal_code: i.postalCode,
                      yelp_business_id: i.yelpBusinessId,
                      limit: i.limit,
                      match_threshold: i.matchThreshold,
                    });
                  },
                ),
                get: query(
                  {
                    description: "Details for one business by its Yelp business ID or alias.",
                    input: object({ id: string({ minLength: 1 }), ...locale }),
                  },
                  async (_ctx, { id, locale }) => c.get(`/v3/businesses/${c.path(id)}`, { locale }),
                ),
                reviews: query(
                  {
                    description:
                      "Review excerpts (up to three) for a business by ID or alias. Requires an Enhanced or Premium Yelp plan.",
                    input: object({ id: string({ minLength: 1 }), ...paging, ...locale, sortBy: string().optional() }),
                  },
                  async (_ctx, i) =>
                    c.get(`/v3/businesses/${c.path(i.id)}/reviews`, {
                      locale: i.locale,
                      offset: i.offset,
                      limit: i.limit,
                      sort_by: i.sortBy,
                    }),
                ),
                reviewHighlights: query(
                  {
                    description: "Review highlights for a business by ID or alias. Requires the Yelp Premium plan.",
                    input: object({ id: string({ minLength: 1 }) }),
                  },
                  async (_ctx, { id }) => c.get(`/v3/businesses/${c.path(id)}/review_highlights`),
                ),
                autocomplete: query(
                  {
                    description: "Suggest search terms, businesses and categories for partial text, optionally near a coordinate.",
                    input: object({
                      text: string({ minLength: 1 }),
                      latitude: number().optional(),
                      longitude: number().optional(),
                      ...locale,
                    }),
                  },
                  async (_ctx, i) => c.get("/v3/autocomplete", i),
                ),
              },
              { title: "Businesses", description: "Search, match and read Yelp business listings and reviews." },
            ),
            categories: router(
              {
                list: query(
                  {
                    description: "All Yelp business categories with aliases, titles and parent categories.",
                    input: object({ ...locale }),
                  },
                  async (_ctx, i) => c.get("/v3/categories", i),
                ),
                get: query(
                  {
                    description: "Details for one category by alias.",
                    input: object({ alias: string({ minLength: 1 }), ...locale }),
                  },
                  async (_ctx, { alias, locale }) => c.get(`/v3/categories/${c.path(alias)}`, { locale }),
                ),
              },
              { title: "Categories", description: "The Yelp category taxonomy." },
            ),
            events: router(
              {
                search: query(
                  {
                    description:
                      "Search events. Give location or both latitude and longitude. startDate and endDate are Unix timestamps, sortOn is popularity or time_start, sortBy asc or desc, categories and excludedEvents comma-separated.",
                    input: object({
                      ...place,
                      ...paging,
                      ...locale,
                      radius: number().optional(),
                      sortBy: string().optional(),
                      sortOn: string().optional(),
                      startDate: number().optional(),
                      endDate: number().optional(),
                      categories: string().optional(),
                      isFree: boolean().optional(),
                      excludedEvents: string().optional(),
                    }),
                  },
                  async (_ctx, i) =>
                    c.get("/v3/events", {
                      location: i.location,
                      latitude: i.latitude,
                      longitude: i.longitude,
                      radius: i.radius,
                      locale: i.locale,
                      offset: i.offset,
                      limit: i.limit,
                      sort_by: i.sortBy,
                      sort_on: i.sortOn,
                      start_date: i.startDate,
                      end_date: i.endDate,
                      categories: i.categories,
                      is_free: i.isFree,
                      excluded_events: i.excludedEvents,
                    }),
                ),
                get: query(
                  {
                    description: "Details for one event by its ID.",
                    input: object({ id: string({ minLength: 1 }), ...locale }),
                  },
                  async (_ctx, { id, locale }) => c.get(`/v3/events/${c.path(id)}`, { locale }),
                ),
                featured: query(
                  {
                    description: "The featured event for a location, picked by Yelp community managers.",
                    input: object({ ...place, ...locale }),
                  },
                  async (_ctx, i) => c.get("/v3/events/featured", i),
                ),
              },
              { title: "Events", description: "Local events on Yelp." },
            ),
            transactions: router(
              {
                searchDelivery: query(
                  {
                    description: "Find businesses that support food delivery near a location or coordinate. Optional term (max 300 characters) narrows results; limit and offset are not exposed.",
                    input: object({ ...place, term: string().optional() }),
                  },
                  async (_ctx, i) => {
                    if (i.term !== undefined && i.term.length > 300) throw new Error("term must be at most 300 characters");
                    return c.get("/v3/transactions/delivery/search", i);
                  },
                ),
              },
              { title: "Transactions", description: "Businesses that support transactions such as delivery." },
            ),
            ai: router(
              {
                chat: query(
                  {
                    description:
                      "Ask Yelp AI a natural-language question about local businesses (max 1000 characters). Omit chatId on the first call and pass the returned chat_id to continue the conversation. latitude and longitude give location context; skipTextGeneration returns only structured data.",
                    input: object({
                      query: string({ minLength: 1 }),
                      chatId: string().optional(),
                      latitude: number().optional(),
                      longitude: number().optional(),
                      skipTextGeneration: boolean().optional(),
                    }),
                  },
                  async (_ctx, i) => {
                    if (i.query.length > 1000) throw new Error("query must be at most 1000 characters");
                    return c.post("/ai/chat/v2", {
                      query: i.query,
                      ...(i.chatId ? { chat_id: i.chatId } : {}),
                      ...(i.latitude !== undefined && i.longitude !== undefined
                        ? { user_context: { latitude: i.latitude, longitude: i.longitude } }
                        : {}),
                      ...(i.skipTextGeneration ? { request_context: { skip_text_generation: true } } : {}),
                    });
                  },
                ),
              },
              { title: "Yelp AI", description: "Conversational local search with Yelp AI." },
            ),
          });
        },
        { signal },
      ),
      {
        title: "Yelp",
        description: "Search Yelp businesses, read reviews and categories, find events and ask Yelp AI about local places.",
        icons,
      },
    ),
  }),
);
