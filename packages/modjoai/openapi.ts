import type { OpenapiToolNamesOptions } from "apps/openapi";

// The document declares no servers; every request goes to api.modjo.ai.
export const options = {
  source: { url: "https://api.modjo.ai/v1/swagger.json" },
  baseUrl: "https://api.modjo.ai",
  allowedOrigin: "https://api.modjo.ai",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "X-API-KEY" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
