import type { OpenapiToolNamesOptions } from "apps/openapi";

// Hailey's official OpenAPI 3.0 document. It declares no servers: production is https://api.haileyhr.app and the
// demo environment is https://api.demo.haileyhr.app, so index.ts pins each account's own origin.
export const placeholderOrigin = "https://api.haileyhr.app";

export const options = {
  source: { url: "https://api.haileyhr.app/docs/v1/docs.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { Bearer: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "Bearer", field: "token", part: "value", prefix: "Bearer " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
