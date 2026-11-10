import type { OpenapiToolNamesOptions } from "apps/openapi";

// Dromo publishes two official OpenAPI documents (listed in https://developer.dromo.io/llms.txt), both on
// app.dromo.io and both authenticated with a backend license key in a header.
export const options = {
  source: { url: "https://developer.dromo.io/api-reference/openapi.json" },
  allowedOrigin: "https://app.dromo.io",
  securitySchemes: { api_key: { type: "apiKey", in: "header", name: "X-Dromo-License-Key" } },
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

export const sessionsOptions = {
  source: { url: "https://developer.dromo.io/api-reference/sessions-openapi.json" },
  allowedOrigin: "https://app.dromo.io",
  securitySchemes: { backend_license_key: { type: "apiKey", in: "header", name: "X-DROMO-LICENSE-KEY" } },
  methods: { apiKey: [{ scheme: "backend_license_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
