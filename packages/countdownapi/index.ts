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

const base = "https://api.countdownapi.com/request";
const accountUrl = "https://api.countdownapi.com/account";
const destinationsUrl = "https://api.countdownapi.com/destinations";

const countdown = defineProvider({
  name: "Countdown API",
  hosts: ["api.countdownapi.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // The Account API is free (no credits) and read-only; a bad key is answered with a non-2xx status.
    const url = new URL(accountUrl);
    url.searchParams.set("api_key", account.fields.token);
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, object({ request_info: object({ success: boolean() }) }));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

// Every Countdown API call is a GET to /request with api_key and type in the query string.
function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (type: string, params: Params = {}) => {
    const url = new URL(base);
    url.searchParams.set("api_key", token);
    url.searchParams.set("type", type);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), { signal });
    return decodeJson(response, json());
  };
}

// Management endpoints (free, read-only) take only api_key plus their own query parameters.
function manage(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (endpoint: string, params: Params = {}) => {
    const url = new URL(endpoint);
    url.searchParams.set("api_key", token);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), { signal });
    return decodeJson(response, json());
  };
}

const optStr = () => string().optional();
const optNum = () => number().optional();
const optBool = () => boolean().optional();
const req = () => string({ minLength: 1 });

const common = {
  customer_location: optStr(),
  customer_zipcode: optStr(),
  include_fields: optStr(),
  exclude_fields: optStr(),
};

const productRef = {
  ebay_domain: optStr(),
  epid: optStr(),
  gtin: optStr(),
  url: optStr(),
};

function build(call: ReturnType<typeof client>, manageCall: ReturnType<typeof manage>) {
  return router(
    {
      search: query(
        {
          description:
            "Search eBay listings. Give search_term (with ebay_domain such as ebay.com) or a search page url. Filters: listing_type (all, buy_it_now, auction, accepts_offers), sort_by (best_match, price_high_to_low, price_low_to_high, price_high_to_low_plus_postage, price_low_to_high_plus_postage, newly_listed, ending_soonest), condition (all, new, used, open_box, manufacturer_refurbished, seller_refurbished, parts_or_not_working, not_specified), num (60, 120, 240), facets ('Brand=SanDisk|Samsung,Format=MicroSD').",
          input: object({
            ebay_domain: optStr(),
            search_term: optStr(),
            url: optStr(),
            category_id: optStr(),
            listing_type: optStr(),
            sort_by: optStr(),
            condition: optStr(),
            page: optNum(),
            max_page: optNum(),
            num: optNum(),
            authorized_sellers: optBool(),
            returns_accepted: optBool(),
            free_returns: optBool(),
            authenticity_verified: optBool(),
            deals_and_savings: optBool(),
            sale_items: optBool(),
            facets: optStr(),
            allow_rewritten_results: optBool(),
            ...common,
          }),
        },
        (_c, p) => call("search", p),
      ),
      autocomplete: query(
        { description: "Search-term suggestions from eBay for a partial term on an eBay domain.", input: object({ ebay_domain: req(), search_term: req() }) },
        (_c, p) => call("autocomplete", p),
      ),
      product: query(
        {
          description:
            "Product details. Identify the product with epid + ebay_domain, gtin (GTIN/ISBN/UPC/EAN) + ebay_domain, or a product page url. include_parts_compatibility needs ebay.com or ebay.co.uk and an epid, cannot be combined with url (costs 2 credits); skip_gtin_cache costs 2 credits.",
          input: object({ ...productRef, skip_gtin_cache: optBool(), include_html: optBool(), include_parts_compatibility: optBool(), ...common }),
        },
        (_c, p) => call("product", p),
      ),
      reviews: query(
        {
          description:
            "Customer reviews for a product. Identify it with epid or gtin plus ebay_domain, or a product page url. condition: all, new, refurbished, preowned. sort_by: most_relevant, most_recent, rating_high_to_low, rating_low_to_high.",
          input: object({
            ...productRef,
            skip_gtin_cache: optBool(),
            condition: optStr(),
            sort_by: optStr(),
            search_term: optStr(),
            page: optNum(),
            max_page: optNum(),
            ...common,
          }),
        },
        (_c, p) => call("reviews", p),
      ),
      sellerProfile: query(
        {
          description: "Seller profile. Give seller_name with ebay_domain, or a seller profile page url. Set is_store for the /str/ storefront format.",
          input: object({ ebay_domain: optStr(), seller_name: optStr(), url: optStr(), is_store: optBool(), ...common }),
        },
        (_c, p) => call("seller_profile", p),
      ),
      sellerFeedback: query(
        {
          description:
            "Feedback for a seller. Give seller_name with ebay_domain, or a feedback page url. seller_feedback_type: all, received_as_buyer, received_as_seller, left_for_others. seller_feedback_time_period: all, one_month, six_months, twelve_months. seller_feedback_overall_rating: positive, neutral, negative (needs a time period). num: 25, 50, 100, 200. search_term only applies to received_as_seller; seller_feedback_time_period only applies to received_as_buyer and received_as_seller.",
          input: object({
            ebay_domain: optStr(),
            seller_name: optStr(),
            url: optStr(),
            seller_feedback_type: optStr(),
            search_term: optStr(),
            seller_feedback_time_period: optStr(),
            seller_feedback_overall_rating: optStr(),
            page: optNum(),
            max_page: optNum(),
            num: optNum(),
            ...common,
          }),
        },
        (_c, p) => call("seller_feedback", p),
      ),
      account: query(
        { description: "Account usage for the current month (credits used, limit and remaining, plan, destinations, collections, usage history) and platform status. Free: consumes no credits.", input: object({}) },
        () => manageCall(accountUrl),
      ),
      destinations: query(
        {
          description:
            "List the account's data export Destinations (for example S3 buckets), 10 per page, with usage and limit counts. Free: consumes no credits. sort_by: type or name; sort_direction: ascending or descending.",
          input: object({ search_term: optStr(), page: optNum(), sort_by: optStr(), sort_direction: optStr() }),
        },
        (_c, p) => manageCall(destinationsUrl, p),
      ),
    },
    { title: "eBay data", description: "Real-time eBay search, product, review and seller data." },
  );
}

export default defineApp(
  { user: { accounts: { countdownapi: countdown.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.countdownapi ?? [], (account) => build(client(account.fields.token, fetch, signal), manage(account.fields.token, fetch, signal)), { signal }),
      {
        title: "Countdown API",
        description: "Real-time eBay data from Countdown API (Traject Data): search results, product details, reviews, seller profiles and seller feedback.",
        icons,
      },
    ),
  }),
);
