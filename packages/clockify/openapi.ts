import type { OpenapiToolNamesOptions } from "apps/openapi";

// Clockify's official OpenAPI document. Requests authenticate with the X-Api-Key header.
// Reports and audit-log operations live on other hosts and are not exposed.
export const options = {
  source: { url: "https://docs.clockify.me/openapi.json" },
  allowedOrigin: "https://api.clockify.me",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", name: "x-api-key", in: "header" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
