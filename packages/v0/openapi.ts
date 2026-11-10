import type { OpenapiToolNamesOptions } from "apps/openapi";

// The document declares an Authorization-header apiKey scheme; v0 expects "Bearer <key>" in it.
export const options = {
  source: { url: "https://api.v0.dev/v1/openapi.json" },
  allowedOrigin: "https://api.v0.dev",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "Bearer " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
