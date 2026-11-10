import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.goextrovert.com/client/v2/docs-json" },
  allowedOrigin: "https://api.goextrovert.com",
  securitySchemes: { "api-key": { type: "apiKey", in: "header", name: "X-API-Key" } },
  methods: { apiKey: [{ scheme: "api-key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
