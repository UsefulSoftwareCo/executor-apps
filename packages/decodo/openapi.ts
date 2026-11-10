import type { OpenapiToolNamesOptions } from "apps/openapi";

// Decodo (formerly Smartproxy) publishes two official OpenAPI documents on help.decodo.com: the Public API
// (sub-users, whitelisted IPs, endpoints, subscriptions) and the dashboard statistics API (traffic, targets).
// Both take the API key as the raw value of the Authorization header.
const credentials = {
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  fallbackSecurity: [{ ApiKeyAuth: [] }],
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

export const publicApiOptions = {
  source: { url: "https://help.decodo.com/api-reference/jero_public_api.yaml" },
  allowedOrigin: "https://api.decodo.com",
  baseUrl: "https://api.decodo.com",
  ...credentials,
  // The generators are GET requests that only build proxy endpoint lists.
  kinds: {},
} satisfies OpenapiToolNamesOptions;

// The statistics operations are POSTs that only read, so they run without an approval prompt.
export const statisticsOptions = {
  source: { url: "https://help.decodo.com/api-reference/jero_dash_stats.yaml" },
  allowedOrigin: "https://api.decodo.com",
  baseUrl: "https://api.decodo.com/api/v2/statistics",
  ...credentials,
  kinds: { "get-targets": "query", "get-traffic": "query" },
} satisfies OpenapiToolNamesOptions;

export const options = publicApiOptions;
