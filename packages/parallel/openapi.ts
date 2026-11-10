import type { OpenapiToolNamesOptions } from "apps/openapi";

// Parallel's own public OpenAPI document.
export const options = {
  source: { url: "https://docs.parallel.ai/public-openapi.json" },
  allowedOrigin: "https://api.parallel.ai",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", name: "x-api-key", in: "header" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
