import type { OpenapiToolNamesOptions } from "apps/openapi";

// Midpage's official REST description. Its only security scheme is a bearer API key; OAuth
// access tokens are accepted on the same header.
export const options = {
  source: { url: "https://docs.midpage.ai/api-reference/openapi.json" },
  allowedOrigin: "https://app.midpage.ai",
  securitySchemes: { apiKey: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ apiKey: [] }],
  methods: {
    apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "apiKey", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
