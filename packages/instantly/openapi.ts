import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developer.instantly.ai/api-reference/openapi.json" },
  allowedOrigin: "https://api.instantly.ai",
  securitySchemes: { ApiKeyAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
