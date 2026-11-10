import type { OpenapiToolNamesOptions } from "apps/openapi";

// Spendesk's official OpenAPI 3.1 document, served by its developer docs. Its server list names production and
// sandbox; production is mounted. Both the API-credential and the OAuth app tokens are sent as bearer tokens.
export const options = {
  source: { url: "https://developer.spendesk.com/openapi/spendesk-public-api.json" },
  allowedOrigin: "https://public-api.spendesk.com",
  baseUrl: "https://public-api.spendesk.com",
  securitySchemes: { Authentication: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ Authentication: [] }],
  methods: {
    credentials: [{ scheme: "Authentication", field: "access_token", part: "value", prefix: "" }],
    oauth: [{ scheme: "Authentication", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
