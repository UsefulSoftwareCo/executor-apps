import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Loop Returns product, one official OpenAPI document per API, all published by Loop at
// https://docs.loopreturns.com/openapi/<name>.yaml. index.ts mounts each under its own key.
const origin = "https://api.loopreturns.com";

// Each document names its API-key schemes differently (api_key, read/write, labels-read...), but every one is
// the same X-Authorization header, so each name is declared and filled from the one key.
const api = (file: string, schemes: readonly string[] = ["api_key"], baseUrl = `${origin}/api/v1`) =>
  ({
    source: { url: `https://docs.loopreturns.com/openapi/${file}.yaml` },
    allowedOrigin: origin,
    baseUrl,
    securitySchemes: Object.fromEntries(
      schemes.map((name) => [name, { type: "apiKey", in: "header", name: "X-Authorization" } as const]),
    ),
    methods: { apiKey: schemes.map((scheme) => ({ scheme, field: "token", part: "value", prefix: "" }) as const) },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

const readWrite = ["read", "write"] as const;

export const apis = {
  returns: api("returns-api"),
  draftReturns: api("draft-returns"),
  dispositioning: api("dispositioning-api"),
  fraudReports: api("fraud-reports-api"),
  orders: api("orders-api", ["read", "write", "orders"]),
  products: api("products-api", readWrite),
  customers: api("customers-api", readWrite),
  collections: api("collections-api", readWrite),
  inventories: api("inventories-api", readWrite),
  locations: api("locations-api", readWrite),
  bulkOperations: api("bulk-operations-api", readWrite),
  listings: api("listings-api"),
  destinations: api("destinations-api"),
  carts: api("carts-api"),
  labels: api("labels-api", ["developer-tools", "labels-read", "label-requests-read", "labels-write", "label-requests-write", "returns"]),
  happyReturns: api("happy-returns-shipment-items-api"),
  webhooks: api("outgoing-webhooks-api", ["api_key"]),
  checkoutPlus: api("checkout-plus-api", ["api_key"], `${origin}/storefront/v1`),
} as const;

// scripts/tools.ts reads `options`; the Returns API is the main one.
export const options = apis.returns;
