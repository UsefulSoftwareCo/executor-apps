import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://webscraping.ai/openapi.yml" },
  allowedOrigin: "https://api.webscraping.ai",
  securitySchemes: { api_key: { type: "apiKey", in: "query", name: "api_key" } },
  methods: { apiKey: [{ scheme: "api_key", field: "apiKey", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
