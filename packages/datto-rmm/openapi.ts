import type { OpenapiToolNamesOptions } from "apps/openapi";

// Datto publishes the same OpenAPI 3.1 document on every platform host at /api/v3/api-docs. This reads the
// pinotage copy; index.ts swaps in the account's own platform host.
export const placeholderOrigin = "https://pinotage-api.centrastage.net";

export const options = {
  source: { url: `${placeholderOrigin}/api/v3/api-docs` },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/api`,
  // The document declares no security. index.ts mints a bearer token from the account's API key and secret.
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    apiKey: [{ scheme: "bearer", field: "apiSecretKey", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
