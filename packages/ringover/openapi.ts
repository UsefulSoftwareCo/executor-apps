import type { OpenapiToolNamesOptions } from "apps/openapi";

// Ringover's published document declares no servers or security schemes. Every operation takes
// the API key in the raw Authorization header (no "Bearer" prefix).
export const options = {
  source: { url: "https://public-api.ringover.com/v2/openapi.json" },
  baseUrl: "https://public-api.ringover.com/v2",
  allowedOrigin: "https://public-api.ringover.com",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "Authorization" } },
  fallbackSecurity: [{ apiKey: [] }],
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
