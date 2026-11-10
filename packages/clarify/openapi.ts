import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.clarify.ai/swagger-json" },
  allowedOrigin: "https://api.clarify.ai",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "api-key " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
