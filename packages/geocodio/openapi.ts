import type { OpenapiToolNamesOptions } from "apps/openapi";

// Geocodio's document lists a self-serve and an enterprise server; this package targets the
// self-serve origin (api.geocod.io). The API key travels as the `api_key` query parameter.
export const options = {
  source: { url: "https://api.geocod.io/openapi-spec.json" },
  allowedOrigin: "https://api.geocod.io",
  securitySchemes: { geocodioApiKey: { type: "apiKey", in: "query", name: "api_key" } },
  fallbackSecurity: [{ geocodioApiKey: [] }],
  methods: { apiKey: [{ scheme: "geocodioApiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
