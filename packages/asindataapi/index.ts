import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  object,
  ProviderError,
  query,
  router,
  secrets,
  string,
  boolean,
} from "apps";
import { icons } from "./icon.js";

const base = "https://api.asindataapi.com";

const asinDataApi = defineProvider({
  name: "ASIN Data API",
  hosts: ["api.asindataapi.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /account is free (no credits) and returns the account that owns the key.
  async health({ account, fetch, signal }) {
    const url = new URL(`${base}/account`);
    url.searchParams.set("api_key", account.fields.token);
    const response = await fetch(url.toString(), { signal });
    // 401 = invalid API key. 402 (out of credits) and 429 (rate limit) are not auth failures and fall through to decodeJson.
    if (response.status === 401) throw new ProviderError({ reason: "unauthorized", status: 401 });
    // Only email is decoded: the docs show name in a sample but do not guarantee it.
    const { account_info } = await decodeJson(response, object({ account_info: object({ email: string() }) }));
    return { accountInfo: { externalId: account_info.email, email: account_info.email } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

// The API takes the key as the api_key query parameter on every request; there is no header auth.
function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, params: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, String(value));
    url.searchParams.set("api_key", token);
    const response = await fetcher(url.toString(), { signal });
    return decodeJson(response, json());
  };
}

const credit = " Costs one credit per request (per page when max_page is used).";
const pages = {
  page: number().optional(),
  max_page: number().optional(),
};

function build(call: ReturnType<typeof client>) {
  const data = (type: string) => (_ctx: unknown, input: Params) => call("/request", { ...input, type });
  return router({
    product: query(
      {
        description:
          "Get the full details of one Amazon product: title, price, rating, images, feature bullets, specifications, categories, buy box and top reviews. Identify it by asin plus amazon_domain (for example amazon.com), by a product page url, or by gtin (GTIN, ISBN, UPC or EAN) plus amazon_domain. Send url or asin/gtin, not both. skip_gtin_cache and include_summarization_attributes (adds per-attribute ratings and a customers-say summary) each cost 2 credits instead of 1." +
          credit,
        input: object({
          amazon_domain: string().optional(),
          asin: string().optional(),
          gtin: string().optional(),
          url: string().optional(),
          skip_gtin_cache: boolean().optional(),
          include_summarization_attributes: boolean().optional(),
        }),
      },
      data("product"),
    ),
    offers: query(
      {
        description:
          "List the offers (sellers, prices, conditions, shipping, Prime eligibility, buy box) for one Amazon product, by asin plus amazon_domain or by product page url. Filter with offers_prime, offers_free_shipping and the offers_condition_* flags. Use page or max_page to paginate." +
          credit,
        input: object({
          amazon_domain: string().optional(),
          asin: string().optional(),
          url: string().optional(),
          offers_prime: boolean().optional(),
          offers_free_shipping: boolean().optional(),
          offers_condition_new: boolean().optional(),
          offers_condition_used_like_new: boolean().optional(),
          offers_condition_used_very_good: boolean().optional(),
          offers_condition_used_good: boolean().optional(),
          offers_condition_used_acceptable: boolean().optional(),
          show_different_asins: boolean().optional(),
          ...pages,
        }),
      },
      data("offers"),
    ),
    search: query(
      {
        description:
          "Search Amazon products by keyword on one marketplace. Use search_term with amazon_domain, or a full Amazon search results url instead. Narrow with category_id, refinements (comma-separated filter values taken from a previous response, such as p_85/2470955011,p_36/2421886011) and exclude_sponsored. sort_by is one of most_recent, price_low_to_high, price_high_to_low, featured, average_review. direct_search disables Amazon's spelling correction. Use page or max_page to paginate." +
          credit,
        input: object({
          amazon_domain: string().optional(),
          search_term: string().optional(),
          url: string().optional(),
          category_id: string().optional(),
          refinements: string().optional(),
          sort_by: string().optional(),
          exclude_sponsored: boolean().optional(),
          direct_search: boolean().optional(),
          ...pages,
        }),
      },
      data("search"),
    ),
    category: query(
      {
        description:
          "List the products in one Amazon category, by category_id plus amazon_domain or by a category page url (not both). Top-level categories cannot be paginated; use the lowest-level category for paging. sort_by is one of most_recent, price_low_to_high, price_high_to_low, featured, average_review. refinements takes comma-separated filter values from a previous response." +
          credit,
        input: object({
          amazon_domain: string().optional(),
          category_id: string().optional(),
          url: string().optional(),
          sort_by: string().optional(),
          refinements: string().optional(),
          ...pages,
        }),
      },
      data("category"),
    ),
    collections: query(
      {
        description:
          "List the Collections (batch request jobs) on the account. Filter by name (search_term/search_type), status, dates, destination_id; paginate with page and page_size (max 1000). Rate-limited to 60 requests per minute. Using the Collections API is free.",
        input: object({
          only_with_results: boolean().optional(),
          only_without_results: boolean().optional(),
          search_term: string().optional(),
          search_type: string().optional(),
          status: string().optional(),
          created_before: string().optional(),
          created_after: string().optional(),
          last_run_before: string().optional(),
          last_run_after: string().optional(),
          destination_id: string().optional(),
          page: number().optional(),
          page_size: number().optional(),
          sort_by: string().optional(),
          sort_direction: string().optional(),
        }),
      },
      (_ctx, input) => call("/collections", input),
    ),
    collection: query(
      {
        description:
          "Get one Collection by id, including whether it is running and its Request and Result Set counts (requests_page_count tells how many pages list_collection_requests has). Free.",
        input: object({ collection_id: string() }),
      },
      (_ctx, input) => call(`/collections/${encodeURIComponent(input.collection_id)}`, {}),
    ),
    collectionRequests: query(
      {
        description:
          "List the Requests in a Collection, 1000 per page (page starts at 1, default 1). Free.",
        input: object({ collection_id: string(), page: number().optional() }),
      },
      (_ctx, input) => call(`/collections/${encodeURIComponent(input.collection_id)}/requests/${input.page ?? 1}`, {}),
    ),
    resultSets: query(
      {
        description:
          "List the Result Sets of a Collection. Result Sets are retained for 14 days. Free.",
        input: object({ collection_id: string() }),
      },
      (_ctx, input) => call(`/collections/${encodeURIComponent(input.collection_id)}/results`, {}),
    ),
    resultSet: query(
      {
        description:
          "Get the results within one Result Set of a Collection as JSON. Free to call; the Requests in the Collection were billed when it ran.",
        input: object({ collection_id: string(), result_set_id: number() }),
      },
      (_ctx, input) => call(`/collections/${encodeURIComponent(input.collection_id)}/results/${input.result_set_id}`, {}),
    ),
    account: query(
      {
        description:
          "Get the account that owns the API key: plan, credits used, credits remaining and reset date, overage setting and destination limits. Free; consumes no credits.",
        input: object({}),
      },
      async () => call("/account", {}),
    ),
  });
}

export default defineApp(
  { user: { accounts: { asinDataApi: asinDataApi.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.asinDataApi ?? [], (account) => build(client(account.fields.token, fetch, signal)), { signal }),
      {
        title: "ASIN Data API",
        description: "Real-time Amazon product data: product details, offers, category listings and keyword search across Amazon marketplaces.",
        icons,
      },
    ),
  }),
);
