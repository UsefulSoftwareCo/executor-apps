import type { OpenapiToolNamesOptions } from "apps/openapi";

// The document lists cloud, staging and local servers; only the cloud origin receives credentials.
export const options = {
  source: { url: "https://api.skyvern.com/openapi.json" },
  allowedOrigin: "https://api.skyvern.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  // 91 of 94 operations declare no `security`, and the document has no global one.
  fallbackSecurity: [{ ApiKeyAuth: [] }],
  oauth: [],
} satisfies OpenapiToolNamesOptions;
