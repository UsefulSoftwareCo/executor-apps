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

const base = "https://api.bestbuy.com";

const bestbuy = defineProvider({
  name: "Best Buy",
  hosts: ["api.bestbuy.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // A bad or exhausted key answers 403.
  async health({ account, fetch, signal }) {
    const url = `${base}/v1/categories(id=abcat0100000)?format=json&show=id&apiKey=${encodeURIComponent(account.fields.token)}`;
    const response = await fetch(url, { signal });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | undefined>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, params: Params = {}) => {
    const search = new URLSearchParams({ format: "json" });
    for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, String(value));
    search.set("apiKey", token);
    const response = await fetcher(`${base}${path}?${search}`, { signal });
    return decodeJson(response, json());
  };
}

const paging = {
  show: string({ minLength: 1 }).optional(),
  sort: string({ minLength: 1 }).optional(),
  page: number().optional(),
  pageSize: number().optional(),
};
const pagingHelp =
  "show is a comma-separated list of attributes to return (or all); sort is attr.asc or attr.dsc, comma-separated; pageSize is 1-100 (default 10).";
const filterHelp =
  "filter is the text that goes inside the parentheses of the Best Buy query syntax: attr=value, & for AND, | for OR, operators = != > < >= <= and `in(a,b)`, trailing * wildcard, search=keyword. Omit it to match everything. Attribute names are case-sensitive, e.g. `search=iphone&salePrice<500`.";

// Keep the Best Buy operator syntax readable; escape only characters that would
// end the path (`#`, `?`) or be misread as an escape (`%`).
function escapeFilter(filter: string) {
  return filter.replace(/%/g, "%25").replace(/#/g, "%23").replace(/\?/g, "%3F");
}

function collection(resource: string, filter: string | undefined) {
  return filter ? `${resource}(${escapeFilter(filter)})` : resource;
}

function build(call: ReturnType<typeof client>) {
  const list = (resource: string) => async (_ctx: unknown, input: { filter?: string | undefined } & Params) => {
    const { filter, ...rest } = input;
    return call(`/v1/${collection(resource, filter)}`, rest);
  };
  const bySku = (suffix: string) => async (_ctx: unknown, { sku, ...rest }: { sku: string } & Params) =>
    call(`/v1/products/${encodeURIComponent(sku)}${suffix}`, rest);
  const sku = string({ minLength: 1 });
  const categoryId = string({ minLength: 1 });

  return router({
    products: router(
      {
        search: query(
          {
            description: `Search products. ${filterHelp} Products default to active=true; add active=* to include inactive. ${pagingHelp} Use cursorMark=* with the nextCursorMark value to page beyond 10 pages.`,
            input: object({ filter: string().optional(), cursorMark: string().optional(), ...paging }),
          },
          list("products"),
        ),
        get: query(
          {
            description: "Get one product by SKU. show limits the returned attributes (comma-separated, or all).",
            input: object({ sku, show: string().optional() }),
          },
          bySku(".json"),
        ),
        warranties: query(
          { description: "List warranties offered for a product SKU.", input: object({ sku, show: string().optional() }) },
          bySku("/warranties.json"),
        ),
        storeAvailability: query(
          {
            description:
              "Find stores that have a product SKU in stock. Give postalCode (searches a 250 mile radius) or storeId.",
            input: object({ sku, postalCode: string().optional(), storeId: string().optional(), show: string().optional() }),
          },
          bySku("/stores.json"),
        ),
      },
      { title: "Products", description: "Search and look up Best Buy products, warranties and in-store availability." },
    ),
    stores: router(
      {
        search: query(
          {
            description: `Search stores. ${filterHelp} Find nearby stores with area(postalCode,miles) or area(lat,lng,miles) (default 10 miles), e.g. \`area(55423,25)\`. show=all includes detailedHours. ${pagingHelp}`,
            input: object({ filter: string().optional(), ...paging }),
          },
          list("stores"),
        ),
      },
      { title: "Stores", description: "Find Best Buy stores." },
    ),
    categories: router(
      {
        search: query(
          {
            description: `Search the category tree. ${filterHelp} Example: \`name=Sony DSLR Camera*\`. ${pagingHelp}`,
            input: object({ filter: string().optional(), ...paging }),
          },
          list("categories"),
        ),
      },
      { title: "Categories", description: "Browse the Best Buy category tree." },
    ),
    recommendations: router(
      {
        trending: query(
          {
            description: "Top 10 trending products in a category. Takes a category ID, not a name.",
            input: object({ categoryId }),
          },
          async (_ctx, { categoryId }) => call(`/v1/products/trendingViewed(categoryId=${encodeURIComponent(categoryId)})`),
        ),
        mostViewed: query(
          {
            description: "Top 10 most viewed products in a category. Takes a category ID, not a name.",
            input: object({ categoryId }),
          },
          async (_ctx, { categoryId }) => call(`/v1/products/mostViewed(categoryId=${encodeURIComponent(categoryId)})`),
        ),
        alsoViewed: query(
          { description: "Top 10 products customers also viewed for a SKU.", input: object({ sku }) },
          bySku("/alsoViewed"),
        ),
        alsoBought: query(
          { description: "Top 10 products customers also bought with a SKU.", input: object({ sku }) },
          bySku("/alsoBought"),
        ),
        viewedUltimatelyBought: query(
          {
            description: "Top 10 products customers viewed for a SKU and ultimately bought instead.",
            input: object({ sku }),
          },
          bySku("/viewedUltimatelyBought"),
        ),
      },
      { title: "Recommendations", description: "Trending, most viewed and related-product recommendations (top 10)." },
    ),
    openBox: router(
      {
        forSku: query(
          { description: "Open-box offers for one SKU.", input: object({ sku }) },
          async (_ctx, { sku }) => call(`/beta/products/${encodeURIComponent(sku)}/openBox`),
        ),
        forSkus: query(
          {
            description: "Open-box offers for up to 100 SKUs, comma-separated (more than 100 is a 400). Not paginated.",
            input: object({ skus: string({ minLength: 1 }) }),
          },
          async (_ctx, { skus }) => call(`/beta/products/openBox(sku in(${skus.replace(/\s+/g, "").split(",").map(encodeURIComponent).join(",")}))`),
        ),
        forCategory: query(
          { description: "Open-box offers in a category, by category ID.", input: object({ categoryId }) },
          async (_ctx, { categoryId }) => call(`/beta/products/openBox(categoryId=${encodeURIComponent(categoryId)})`),
        ),
      },
      { title: "Open box", description: "Open-box buying options." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { bestbuy: bestbuy.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.bestbuy ?? [], (account) => build(client(account.fields.token, fetch, signal)), { signal }),
      {
        title: "Best Buy",
        description: "Best Buy products, stores, categories, recommendations, warranties, in-store availability and open-box offers.",
        icons,
      },
    ),
  }),
);
