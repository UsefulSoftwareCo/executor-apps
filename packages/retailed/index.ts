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

const base = "https://app.retailed.io/api/v1";

const retailed = defineProvider({
  name: "Retailed",
  hosts: ["app.retailed.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Read-only plan/usage endpoint; its credit cost is not stated in the vendor docs.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/usage`, { signal, headers: { "x-api-key": account.fields.token } });
    await decodeJson(response, object({ plan: string() }));
  },
});

type Account = { fields: { token: string } };

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const retailedTools = (account: Account, signal: AbortSignal) => {
  const get = async (
    fetch: typeof globalThis.fetch,
    path: string,
    params: Record<string, string | number | undefined>,
  ) => {
    const qs = search(params);
    return decodeJson(
      await fetch(`${base}/${path}${qs === "" ? "" : `?${qs}`}`, {
        signal,
        headers: { "x-api-key": account.fields.token, accept: "application/json" },
      }),
      json(),
    );
  };

  const product = (site: string, label: string, hint: string) =>
    query(
      {
        description: `Get ${label} product details. query is ${hint}. Costs API credits.`,
        input: object({ query: string() }),
      },
      async ({ fetch }, input) => get(fetch, `scraper/${site}/product`, input),
    );

  const dbInput = object({
    filters: record(string()).optional(),
    page: number().optional(),
    sort: string().optional(),
  });
  const db = (path: string, label: string, example: string) =>
    query(
      {
        description: `Query Retailed's ${label} database. filters maps raw query keys to values using the where syntax, for example ${example}. Operators: equals, not_equals, greater_than, greater_than_equal, less_than, less_than_equal, like, contains, in, not_in, all, exists. Use separate [or][n] indexes for OR branches. sort accepts a field name, prefix with - for descending. Paginate with page and the response totalPages.`,
        input: dbInput,
      },
      async ({ fetch }, { filters, page, sort }) => get(fetch, path, { ...filters, page, sort }),
    );

  return router({
    usage: query(
      { description: "Get the API plan name and remaining request credits for this key.", input: object({}) },
      async ({ fetch }) => get(fetch, "usage", {}),
    ),
    stockx: router(
      {
        search: query(
          {
            description:
              "Search StockX by product name, brand, SKU (DN3707-100) or slug. Returns id, slug, name, sku, category, brand, image and colorway.",
            input: object({ query: string() }),
          },
          async ({ fetch }, input) => get(fetch, "scraper/stockx/search", input),
        ),
        product: query(
          {
            description:
              "Get a StockX product with sizes and market data. query is the StockX slug (nike-air-max-1-travis-scott-wheat). Optional country (US), language (en-US) and currency (USD). Uses scraper/stockx/product; the vendor docs list GET /product instead, but an unauthenticated probe returned 404 for /product and 401 (route exists) for scraper/stockx/product.",
            input: object({
              query: string(),
              country: string().optional(),
              language: string().optional(),
              currency: string().optional(),
            }),
          },
          async ({ fetch }, input) => get(fetch, "scraper/stockx/product", input),
        ),
        trends: query(
          {
            description:
              "Get current StockX trending products. query is one of sneakers, streetwear, electronics, trading cards, collectibles, apparel, handbags, watches; country is required (US, FR or GB); sort_by is optional: featured, most_active or release_date.",
            input: object({ query: string(), country: string(), sort_by: string().optional() }),
          },
          async ({ fetch }, input) => get(fetch, "scraper/stockx/trends", input),
        ),
      },
      { title: "StockX" },
    ),
    goat: router(
      {
        search: query(
          {
            description: "Search GOAT by product name or SKU (DN3673-303).",
            input: object({ query: string() }),
          },
          async ({ fetch }, input) => get(fetch, "scraper/goat/search", input),
        ),
        product: product("goat", "GOAT", "a GOAT product URL or slug"),
        prices: query(
          {
            description:
              "Get the latest GOAT prices per size for a product. query is the numeric GOAT product id (719082). country is UK, FR or US (default US).",
            input: object({ query: string(), country: string().optional() }),
          },
          async ({ fetch }, input) => get(fetch, "scraper/goat/prices", input),
        ),
        trends: query(
          {
            description: "Get the latest GOAT trends. sort_by is relevance or release_date; page starts at 1.",
            input: object({ sort_by: string(), page: number() }),
          },
          async ({ fetch }, input) => get(fetch, "scraper/goat/trends", input),
        ),
      },
      { title: "GOAT" },
    ),
    chrono24: router(
      {
        search: query(
          {
            description:
              "Search Chrono24 watch listings. Filters are comma-separated strings (manufacturer=Rolex,Omega, model, reference_number, case_material, dial_color, movement_type, condition, year, ...) Price filters are not documented for this endpoint; if needed, try priceFrom / priceTo via filters (unverified). sort_by is relevance, price_asc, price_desc, age_desc or age_asc; page_size is 30, 60 or 120; page starts at 1 (documented as a body parameter on a GET; sent here as a query string, unverified); currency (EUR), language (en_US) and domain (com) are optional. Any other documented filter name can be passed in filters.",
            input: object({
              manufacturer: string().optional(),
              model: string().optional(),
              reference_number: string().optional(),
              sort_by: string().optional(),
              page_size: number().optional(),
              page: number().optional(),
              currency: string().optional(),
              language: string().optional(),
              domain: string().optional(),
              filters: record(string()).optional(),
            }),
          },
          async ({ fetch }, { filters, ...input }) => get(fetch, "scraper/chrono24/search", { ...filters, ...input }),
        ),
        product: product("chrono24", "Chrono24", "a Chrono24 listing URL"),
      },
      { title: "Chrono24" },
    ),
    retail: router(
      {
        bestbuySearch: query(
          {
            description: "Search Best Buy. sort is for example best_selling; page starts at 1.",
            input: object({ query: string(), page: number().optional(), sort: string().optional() }),
          },
          async ({ fetch }, input) => get(fetch, "scraper/bestbuy/search", input),
        ),
        bestbuyProduct: product("bestbuy", "Best Buy", "a Best Buy product URL"),
        diorProduct: product("dior", "Dior", "a Dior product URL"),
        farfetchProduct: query(
          {
            description:
              "Get Farfetch product details. query is a Farfetch product URL. Optional mode (simple), country (UK) and language (en-GB). Costs API credits.",
            input: object({
              query: string(),
              mode: string().optional(),
              country: string().optional(),
              language: string().optional(),
            }),
          },
          async ({ fetch }, input) => get(fetch, "scraper/farfetch/product", input),
        ),
        forever21Product: product("forever21", "Forever21", "a Forever21 product URL"),
        macysProduct: product("macys", "Macy's", "a Macy's product URL"),
        nikeProduct: product("nike", "Nike", "a Nike product URL"),
        stadiumgoodsProduct: product("stadiumgoods", "Stadium Goods", "a SKU such as BQ6472-015"),
        uniqloProduct: query(
          {
            description: "Get Uniqlo product details. query is the product id (465200); country is required (UK). Costs API credits.",
            input: object({ query: string(), country: string() }),
          },
          async ({ fetch }, input) => get(fetch, "scraper/uniqlo/product", input),
        ),
        zalandoProduct: product("zalando", "Zalando", "a Zalando product URL"),
        zaraProduct: product("zara", "Zara", "a Zara product URL"),
      },
      { title: "Retail sites", description: "Product lookups on individual retail websites." },
    ),
    database: router(
      {
        products: db(
          "db/products",
          "products",
          '{"where[or][0][and][0][sku][equals]": "CD4487-100"}',
        ),
        variants: db(
          "db/variants",
          "variants",
          '{"where[or][0][and][0][category][equals]": "collectibles"}',
        ),
        prices: db(
          "db/prices",
          "historical prices",
          '{"where[or][0][and][0][product.sku][equals]": "FN0598-200", "where[or][0][and][0][size][in]": "8,6,10"}',
        ),
        shopifyProducts: query(
          {
            description:
              "Search products of a connected Shopify store. index is the store index name (mystore); query is a SKU or text (DM1275-250).",
            input: object({ index: string().optional(), query: string().optional() }),
          },
          async ({ fetch }, input) => get(fetch, "shopify/products", input),
        ),
      },
      { title: "Database", description: "Retailed's own product, variant and price database." },
    ),
  });
};

export default defineApp({ user: { accounts: { retailed: retailed.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.retailed ?? [], (account) => retailedTools(account, signal), { signal }), {
    title: "Retailed",
    description:
      "Sneaker, watch and retail product data: StockX, GOAT, Chrono24, Best Buy, Nike, Zara and more, plus Retailed's product and price database.",
    icons,
  }),
}));
