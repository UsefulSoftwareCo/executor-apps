import type { OpenapiToolNamesOptions } from "apps/openapi";

// CoinMarketCap's own OpenAPI document, linked from its API documentation.
export const options = {
  source: { url: "https://coinmarketcap.com/api/documentation/openapi.json" },
  allowedOrigin: "https://pro-api.coinmarketcap.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "X-CMC_PRO_API_KEY" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
