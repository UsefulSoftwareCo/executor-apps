import type { OpenapiToolNamesOptions } from "apps/openapi";

const schema = (name: string) => `https://docs.polymarket.us/api-reference/oapi-schemas/${name}-schema.json`;

// Public market data lives on the gateway host and needs no credentials.
const publicOptions = (name: string) =>
  ({
    source: { url: schema(name) },
    allowedOrigin: "https://gateway.polymarket.us",
    baseUrl: "https://gateway.polymarket.us",
    securitySchemes: {},
    methods: { apiKey: [] },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

// Authenticated endpoints declare three header schemes. Only the key id is a stored credential:
// the timestamp and the Ed25519 signature are computed per request by the signing fetch in index.ts,
// so the document's global requirement is reduced to the key id here.
const privateOptions = (name: string) =>
  ({
    source: { url: schema(name) },
    allowedOrigin: "https://api.polymarket.us",
    baseUrl: "https://api.polymarket.us",
    securitySchemes: { "X-PM-Access-Key": { type: "apiKey", in: "header", name: "X-PM-Access-Key" } },
    fallbackSecurity: [{ "X-PM-Access-Key": [] }],
    patches: [{ op: "add", path: "/security", value: [{ "X-PM-Access-Key": [] }] }],
    methods: { apiKey: [{ scheme: "X-PM-Access-Key", field: "keyId", part: "value", prefix: "" }] },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const marketsOptions = publicOptions("markets");
export const eventsOptions = publicOptions("events");
export const seriesOptions = publicOptions("series");
export const searchOptions = publicOptions("search");
export const sportsOptions = publicOptions("sports");
export const tagsOptions = publicOptions("tags");
export const priceHistoryOptions = publicOptions("price-history");
export const assetPricesOptions = publicOptions("asset-prices");
export const ordersOptions = privateOptions("orders");
export const portfolioOptions = privateOptions("portfolio");
export const rfqsOptions = privateOptions("rfqs");
export const combosOptions = privateOptions("combos");
export const incentivesOptions = privateOptions("incentives");

// scripts/tools.ts reads this.
export const options = marketsOptions;
export const all = {
  markets: marketsOptions,
  events: eventsOptions,
  series: seriesOptions,
  search: searchOptions,
  sports: sportsOptions,
  tags: tagsOptions,
  priceHistory: priceHistoryOptions,
  assetPrices: assetPricesOptions,
  orders: ordersOptions,
  portfolio: portfolioOptions,
  rfqs: rfqsOptions,
  combos: combosOptions,
  incentives: incentivesOptions,
};
