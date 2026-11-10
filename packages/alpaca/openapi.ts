import type { OpenapiToolNamesOptions } from "apps/openapi";

const keys = (key: string, secret: string) => [
  { scheme: key, field: "keyId", part: "value" as const, prefix: "" },
  { scheme: secret, field: "secretKey", part: "value" as const, prefix: "" },
];
const bearer = [{ scheme: "bearer", field: "access_token", part: "value" as const, prefix: "" }];

const tradingSecurity: Record<string, string[]>[] = [{ API_Key: [], API_Secret: [] }, { bearer: [] }];
const dataSecurity: Record<string, string[]>[] = [{ apiKey: [], apiSecret: [] }, { bearer: [] }];

export type Environment = "paper" | "live";
export const tradingOrigin = (environment: Environment) =>
  environment === "paper" ? "https://paper-api.alpaca.markets" : "https://api.alpaca.markets";

// Alpaca's description declares only the key-pair headers. OAuth tokens are sent as a bearer
// token, so the patches add that scheme as a second alternative.
export const trading = (environment: Environment) =>
  ({
    source: { url: "https://docs.alpaca.markets/us/openapi/trading-api.json" },
    allowedOrigin: tradingOrigin(environment),
    baseUrl: tradingOrigin(environment),
    securitySchemes: {
      API_Key: { type: "apiKey", in: "header", name: "APCA-API-KEY-ID" },
      API_Secret: { type: "apiKey", in: "header", name: "APCA-API-SECRET-KEY" },
      bearer: { type: "http", scheme: "bearer" },
    },
    methods: {
      [`${environment}Keys`]: keys("API_Key", "API_Secret"),
      [`${environment}OAuth`]: bearer,
    },
    oauth: [],
    patches: [
      { op: "add", path: "/components/securitySchemes/bearer", value: { type: "http", scheme: "bearer" } },
      { op: "add", path: "/security", value: tradingSecurity },
    ],
  }) satisfies OpenapiToolNamesOptions;

// Market data is served from one host for every key and token; paper and live accounts share it.
export const marketData = {
  source: { url: "https://docs.alpaca.markets/us/openapi/market-data-api.json" },
  allowedOrigin: "https://data.alpaca.markets",
  baseUrl: "https://data.alpaca.markets",
  securitySchemes: {
    apiKey: { type: "apiKey", in: "header", name: "APCA-API-KEY-ID" },
    apiSecret: { type: "apiKey", in: "header", name: "APCA-API-SECRET-KEY" },
    bearer: { type: "http", scheme: "bearer" },
  },
  methods: {
    paperKeys: keys("apiKey", "apiSecret"),
    liveKeys: keys("apiKey", "apiSecret"),
    paperOAuth: bearer,
    liveOAuth: bearer,
  },
  oauth: [],
  // Every operation lists its own security alternatives; each gains the bearer one.
  patches: [
    { op: "add", path: "/components/securitySchemes/bearer", value: { type: "http", scheme: "bearer" } },
    { op: "add", path: "/paths/~1v1beta1~1fixed_income~1latest~1prices/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta1~1fixed_income~1latest~1quotes/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta1~1forex~1latest~1rates/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta1~1forex~1rates/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta1~1logos~1{symbol}/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta1~1news/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta1~1options~1bars/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta1~1options~1meta~1conditions~1{ticktype}/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta1~1options~1meta~1exchanges/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta1~1options~1quotes~1latest/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta1~1options~1snapshots/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta1~1options~1snapshots~1{underlying_symbol}/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta1~1options~1trades/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta1~1options~1trades~1latest/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta1~1screener~1{market_type}~1movers/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta1~1screener~1stocks~1most-actives/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta3~1crypto~1{loc}~1bars/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta3~1crypto~1{loc}~1latest~1bars/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta3~1crypto~1{loc}~1latest~1orderbooks/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta3~1crypto~1{loc}~1latest~1quotes/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta3~1crypto~1{loc}~1latest~1trades/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta3~1crypto~1{loc}~1quotes/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta3~1crypto~1{loc}~1snapshots/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1beta3~1crypto~1{loc}~1trades/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v1~1corporate-actions/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v2~1stocks~1{symbol}~1auctions/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v2~1stocks~1{symbol}~1bars/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v2~1stocks~1{symbol}~1bars~1latest/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v2~1stocks~1{symbol}~1quotes/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v2~1stocks~1{symbol}~1quotes~1latest/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v2~1stocks~1{symbol}~1snapshot/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v2~1stocks~1{symbol}~1trades/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v2~1stocks~1{symbol}~1trades~1latest/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v2~1stocks~1auctions/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v2~1stocks~1bars/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v2~1stocks~1bars~1latest/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v2~1stocks~1meta~1conditions~1{ticktype}/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v2~1stocks~1meta~1exchanges/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v2~1stocks~1quotes/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v2~1stocks~1quotes~1latest/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v2~1stocks~1snapshots/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v2~1stocks~1trades/get/security", value: dataSecurity },
    { op: "add", path: "/paths/~1v2~1stocks~1trades~1latest/get/security", value: dataSecurity },
  ],
} satisfies OpenapiToolNamesOptions;

export const options = trading("live");
