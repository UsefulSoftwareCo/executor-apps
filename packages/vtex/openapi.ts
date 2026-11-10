import type { OpenapiToolNamesOptions } from "apps/openapi";

// VTEX's official OpenAPI 3.0 documents from https://github.com/vtex/openapi-schemas. VTEX publishes one document
// per API; each is mounted under its own key in index.ts, which swaps in the account's origin. The placeholder
// origin below is only used to compile.
const spec = (name: string) => ({
  url: `https://raw.githubusercontent.com/vtex/openapi-schemas/master/${encodeURIComponent(`VTEX - ${name}.json`)}`,
});

export const placeholderOrigin = "https://account.vtexcommercestable.com.br";

const credentials = {
  securitySchemes: {
    appKey: { type: "apiKey", in: "header", name: "X-VTEX-API-AppKey" },
    appToken: { type: "apiKey", in: "header", name: "X-VTEX-API-AppToken" },
  },
  methods: {
    apiKey: [
      { scheme: "appKey", field: "appKey", part: "value", prefix: "" },
      { scheme: "appToken", field: "appToken", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} as const;

const api = (name: string, path = "") =>
  ({
    source: spec(name),
    allowedOrigin: placeholderOrigin,
    baseUrl: `${placeholderOrigin}${path}`,
    ...credentials,
  }) satisfies OpenapiToolNamesOptions;

export const catalogOptions = api("Catalog API");
export const checkoutOptions = api("Checkout API");
export const ordersOptions = api("Orders API");
export const pricingOptions = api("Pricing API");
export const logisticsOptions = api("Logistics API");
export const masterdataOptions = api("Master Data API - v2");
export const licenseManagerOptions = api("License Manager API");
export const promotionsOptions = api("Promotions & Taxes API");
export const searchOptions = api("Search API");
export const subscriptionsOptions = api("Subscriptions API v3");
export const customerCreditOptions = api("Customer Credit API");
export const profileOptions = api("Profile System");
export const giftcardOptions = api("Giftcard API", "/api");
export const skuBindingsOptions = api("SKU Bindings API", "/api");
export const marketplaceOptions = api("Marketplace APIs", "/api");
export const policiesOptions = api("Policies System API");

export const mounts = {
  catalog: catalogOptions,
  checkout: checkoutOptions,
  orders: ordersOptions,
  pricing: pricingOptions,
  logistics: logisticsOptions,
  masterdata: masterdataOptions,
  licenseManager: licenseManagerOptions,
  promotions: promotionsOptions,
  search: searchOptions,
  subscriptions: subscriptionsOptions,
  customerCredit: customerCreditOptions,
  profile: profileOptions,
  giftcard: giftcardOptions,
  skuBindings: skuBindingsOptions,
  marketplace: marketplaceOptions,
  policies: policiesOptions,
};

// scripts/tools.ts compiles this one; the other mounts compile the same way.
export const options = catalogOptions;
