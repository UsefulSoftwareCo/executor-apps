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
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.redcircleapi.com";

const redcircle = defineProvider({
  name: "RedCircle API",
  hosts: ["api.redcircleapi.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The Account API is free and does not consume credits.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/account?${new URLSearchParams({ api_key: account.fields.token })}`, {
      signal,
    });
    if (!response.ok) throw new Error(`RedCircle API account check failed with HTTP ${response.status}`);
  },
});

type Account = { fields: { token: string } };
type Params = Record<string, string | number | boolean | undefined>;

const search = (account: Account, params: Params) => {
  const out = new URLSearchParams({ api_key: account.fields.token });
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const product = {
  tcin: string().optional(),
  dpci: string().optional(),
  gtin: string().optional(),
  url: string().optional(),
};

const common = {
  customer_zipcode: string().optional(),
  include_fields: string().optional(),
  exclude_fields: string().optional(),
};

const listing = {
  sort_by: string().optional(),
  delivery_type: string().optional(),
  rating: string().optional(),
  include_out_of_stock: boolean().optional(),
  page: number().optional(),
  max_page: number().optional(),
  facets: string().optional(),
  url: string().optional(),
  ...common,
};

const listingNote =
  "sort_by: best_seller, price_high_to_low, price_low_to_high, best_match, highest_rating, newly_listed, featured. delivery_type: in_store_pickup, same_day_delivery, buy_at_store (both use customer_zipcode), ship_to_home. rating: one_star to five_star. facets: comma-separated facet ids from earlier responses. max_page fetches several pages in one call (each page costs a credit). If url is given all other parameters are ignored.";

const redcircleTools = (account: Account, signal: AbortSignal) => {
  const get = (path: string, params: Params, fetch: typeof globalThis.fetch) =>
    fetch(`${base}${path}?${search(account, params)}`, { signal }).then((response) => decodeJson(response, json()));
  const zipcodeBody = object({ zipcode: string(), domain: string() });

  return router({
    product: query(
      {
        description:
          "Get Target product page data (title, brand, price, images, specifications, ratings, fulfillment) for one item. Identify it with tcin, dpci, gtin or url; url beats gtin, which beats tcin and dpci. Costs 1 credit (2 for a gtin lookup with skip_gtin_cache).",
        input: object({ ...product, skip_gtin_cache: boolean().optional(), ...common }),
      },
      ({ fetch }, input) => get("/request", { type: "product", ...input }, fetch),
    ),
    search: query(
      {
        description: `Search Target for a search_term (or a Target search url) and return results with pagination, facets, categories and related queries. Optional category_id limits the search to one category. ${listingNote}`,
        input: object({ search_term: string().optional(), category_id: string().optional(), ...listing }),
      },
      ({ fetch }, input) => get("/request", { type: "search", ...input }, fetch),
    ),
    category: query(
      {
        description: `List the products in one Target category by category_id (required unless url is given; ids come from the categories tool) or a Target category page url. ${listingNote}`,
        input: object({ category_id: string().optional(), ...listing }),
      },
      ({ fetch }, input) => get("/request", { type: "category", ...input }, fetch),
    ),
    reviews: query(
      {
        description:
          "Get customer reviews for a Target product identified by tcin, dpci, gtin or url. reviewer_type: verified_purchase or all. review_stars: all_stars, five_star, four_star, three_star, two_star, one_star. review_media_type: all_reviews or media_reviews_only. sort_by: most_recent, high_to_low_rating, low_to_high_rating, most_helpful. page and max_page paginate.",
        input: object({
          ...product,
          reviewer_type: string().optional(),
          review_stars: string().optional(),
          review_media_type: string().optional(),
          sort_by: string().optional(),
          page: number().optional(),
          max_page: number().optional(),
          skip_gtin_cache: boolean().optional(),
          ...common,
        }),
      },
      ({ fetch }, input) => get("/request", { type: "reviews", ...input }, fetch),
    ),
    storeStock: query(
      {
        description:
          "Check in-store stock for one Target product (tcin, dpci, gtin or url) at up to 20 stores within 50 miles of store_stock_zipcode. Set only_in_stock to list only stores that have the item. The zipcode need not be registered with the zipcodes tool.",
        input: object({
          ...product,
          store_stock_zipcode: string(),
          only_in_stock: boolean().optional(),
          ...common,
        }),
      },
      ({ fetch }, input) => get("/request", { type: "store_stock", ...input }, fetch),
    ),
    categories: query(
      {
        description:
          "Browse Target's category hierarchy. With no arguments, lists the top-level categories. Use parent_id to list the children of a category, id to fetch one category, or search_term to search the hierarchy by name. Pass only one of the three. The returned ids are category_id values for the search and category tools.",
        input: object({ id: string().optional(), parent_id: string().optional(), search_term: string().optional() }),
      },
      ({ fetch }, input) => get("/categories", input, fetch),
    ),
    account: query(
      {
        description:
          "Get account details and platform status: plan, credits used, limit and remaining, reset date, zipcode, collection and destination quotas, account balance, and 3 months of usage history. Documented as free of credits.",
        input: object({}),
      },
      ({ fetch }) => get("/account", {}, fetch),
    ),
    zipcodes: router({
      list: query(
        {
          description:
            "List the customer zipcodes registered on the account (10 per page) with their status (preparing or available) and the zipcode quota usage. Optional search_term matches part of a zipcode and domain restricts to one site such as target.com.",
          input: object({ search_term: string().optional(), domain: string().optional(), page: number().optional() }),
        },
        ({ fetch }, input) => get("/zipcodes", input, fetch),
      ),
      add: mutation(
        {
          description:
            "Register zipcodes for use as customer_zipcode. Each entry has a zipcode and a domain (for example target.com). New zipcodes are preparing for about 2 minutes before requests can use them. Counts against the plan's zipcode quota.",
          input: object({ zipcodes: array(zipcodeBody) }),
          approval: always(),
        },
        async ({ fetch }, { zipcodes }) =>
          decodeJson(
            await fetch(`${base}/zipcodes?${search(account, {})}`, {
              method: "POST",
              signal,
              headers: { "content-type": "application/json" },
              body: JSON.stringify(zipcodes),
            }),
            json(),
          ),
      ),
      delete: mutation(
        {
          description:
            "Remove registered zipcodes. Any request, including those inside existing collections, that uses a deleted zipcode as customer_zipcode will fail.",
          input: object({ zipcodes: array(zipcodeBody) }),
          approval: always(),
        },
        async ({ fetch }, { zipcodes }) =>
          decodeJson(
            await fetch(`${base}/zipcodes?${search(account, {})}`, {
              method: "DELETE",
              signal,
              headers: { "content-type": "application/json" },
              body: JSON.stringify(zipcodes),
            }),
            json(),
          ),
      ),
    }),
  });
};

export default defineApp({ user: { accounts: { redcircleapi: redcircle.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.redcircleapi ?? [], (account) => redcircleTools(account, signal), { signal }), {
    title: "RedCircle API",
    description:
      "Real-time Target.com data: product details, search and category listings, reviews and store stock, plus category lookup, account usage and zipcodes.",
    icons,
    instructions:
      "Every product, search, category, reviews and store_stock request costs credits (1 per page); the account call is documented as free. Check `account` for credits_remaining before large max_page requests.",
  }),
}));
