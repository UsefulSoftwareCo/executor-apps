import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.blitz-api.ai/api-reference/v2.openapi.json" },
  allowedOrigin: "https://api.blitz-api.ai",
  securitySchemes: { APIKey: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "APIKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
