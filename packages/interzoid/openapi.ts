import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.interzoid.com/openapi.json" },
  allowedOrigin: "https://api.interzoid.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

// Batch Match API: a separate spec and host. Its key travels in the `apikey` query parameter.
export const matchOptions = {
  source: { url: "https://match.interzoid.com/openapi.json" },
  allowedOrigin: "https://match.interzoid.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "query", name: "apikey" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
