import type { OpenapiToolNamesOptions } from "apps/openapi";

// Polymarket US publishes one official OpenAPI document per area at docs.polymarket.us. Market data is public on
// gateway.polymarket.us; trading, portfolio, RFQs, combos and incentives are on api.polymarket.us and are signed
// by index.ts (Ed25519), which adds X-PM-Timestamp and X-PM-Signature to every api.polymarket.us request.
const spec = (name: string) => ({ url: `https://docs.polymarket.us/api-reference/oapi-schemas/${name}-schema.json` });

const gateway = "https://gateway.polymarket.us";
const api = "https://api.polymarket.us";

const publicApi = (name: string) =>
  ({ source: spec(name), allowedOrigin: gateway, baseUrl: gateway, securitySchemes: {}, methods: {}, oauth: [] }) satisfies OpenapiToolNamesOptions;

const securitySchemes = {
  "X-PM-Access-Key": { type: "apiKey", in: "header", name: "X-PM-Access-Key" },
} as const;

const signedApi = <const K extends Record<string, "query">>(name: string, kinds: K) =>
  ({
    source: spec(name),
    allowedOrigin: api,
    baseUrl: api,
    securitySchemes,
    // Only the key id is a stored credential; index.ts computes X-PM-Timestamp and X-PM-Signature per request.
    fallbackSecurity: [{ "X-PM-Access-Key": [] }],
    patches: [{ op: "add", path: "/security", value: [{ "X-PM-Access-Key": [] }] }],
    methods: { apiKey: [{ scheme: "X-PM-Access-Key", field: "keyId", part: "value", prefix: "" }] },
    oauth: [],
    kinds,
  }) satisfies OpenapiToolNamesOptions;

export const eventsOptions = publicApi("events");
export const marketsOptions = publicApi("markets");
export const searchOptions = publicApi("search");
export const seriesOptions = publicApi("series");
export const tagsOptions = publicApi("tags");
export const sportsOptions = publicApi("sports");
export const priceHistoryOptions = publicApi("price-history");
export const assetPricesOptions = publicApi("asset-prices");
// Order preview computes a result without placing anything.
export const ordersOptions = signedApi("orders", { OrdersService_PreviewOrder: "query" });
export const portfolioOptions = signedApi("portfolio", {});
export const rfqsOptions = signedApi("rfqs", {});
export const combosOptions = signedApi("combos", {});
export const incentivesOptions = signedApi("incentives", {});

export const apis = {
  events: eventsOptions,
  markets: marketsOptions,
  search: searchOptions,
  series: seriesOptions,
  tags: tagsOptions,
  sports: sportsOptions,
  priceHistory: priceHistoryOptions,
  assetPrices: assetPricesOptions,
  orders: ordersOptions,
  portfolio: portfolioOptions,
  rfqs: rfqsOptions,
  combos: combosOptions,
  incentives: incentivesOptions,
} as const;

// scripts/tools.ts reads `options`.
export const options = marketsOptions;
