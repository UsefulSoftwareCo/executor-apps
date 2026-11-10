import type { OpenapiToolNamesOptions } from "apps/openapi";

// iLert's document declares a relative server ("/api") and an apiKey scheme in the Authorization header
// whose value is "Bearer <key>".
export const options = {
  source: { url: "https://api.ilert.com/api-docs/openapi.json" },
  baseUrl: "https://api.ilert.com/api",
  allowedOrigin: "https://api.ilert.com",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "Bearer " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
