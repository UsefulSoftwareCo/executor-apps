import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.x.ai/api-docs/openapi.json" },
  allowedOrigin: "https://api.x.ai",
  baseUrl: "https://api.x.ai",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
