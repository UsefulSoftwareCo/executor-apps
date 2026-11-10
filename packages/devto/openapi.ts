import type { OpenapiToolNamesOptions } from "apps/openapi";

// Forem's published API V1 description (used by dev.to). It declares a single `api-key` header scheme.
export const options = {
  source: { url: "https://raw.githubusercontent.com/forem/forem-docs/974a6b62dc48d7500ec724ebc65287eed7ea946f/api_v1.json" },
  allowedOrigin: "https://dev.to",
  securitySchemes: { "api-key": { type: "apiKey", name: "api-key", in: "header" } },
  fallbackSecurity: [{ "api-key": [] }],
  methods: { apiKey: [{ scheme: "api-key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
