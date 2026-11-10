import type { OpenapiToolNamesOptions } from "apps/openapi";

// Official specs from github.com/coingecko/coingecko-api-oas (MIT), synced from CoinGecko's docs.
// Pinned to a commit so the tool surface only changes on review.
// Pro keys are sent to pro-api.coingecko.com; Demo keys to api.coingecko.com.
export const options = {
  source: { url: "https://raw.githubusercontent.com/coingecko/coingecko-api-oas/cb4d19a08a8489d4d7815d617cb219f2e45a6aa8/pro-api.json" },
  allowedOrigin: "https://pro-api.coingecko.com",
  securitySchemes: { headerAuth: { type: "apiKey", in: "header", name: "x-cg-pro-api-key" } },
  methods: { apiKey: [{ scheme: "headerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

export const demoOptions = {
  source: { url: "https://raw.githubusercontent.com/coingecko/coingecko-api-oas/cb4d19a08a8489d4d7815d617cb219f2e45a6aa8/demo-api.json" },
  allowedOrigin: "https://api.coingecko.com",
  securitySchemes: { headerAuth: { type: "apiKey", in: "header", name: "x-cg-demo-api-key" } },
  methods: { apiKey: [{ scheme: "headerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
