import type { OpenapiToolNamesOptions } from "apps/openapi";

const common = {
  allowedOrigin: "https://api.mintlify.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

// Mintlify publishes several OpenAPI documents for the admin API key on api.mintlify.com.
export const options = {
  ...common,
  source: { url: "https://www.mintlify.com/docs/admin-openapi.json" },
} satisfies OpenapiToolNamesOptions;

export const externalOptions = {
  ...common,
  source: { url: "https://www.mintlify.com/docs/openapi.json" },
} satisfies OpenapiToolNamesOptions;

export const analyticsOptions = {
  ...common,
  source: { url: "https://www.mintlify.com/docs/analytics.openapi.json" },
} satisfies OpenapiToolNamesOptions;

export const staticExportOptions = {
  ...common,
  source: { url: "https://www.mintlify.com/docs/static-export-openapi.json" },
} satisfies OpenapiToolNamesOptions;
