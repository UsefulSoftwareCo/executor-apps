import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.card.ly/openapi/en-AU/2.2.0/json" },
  allowedOrigin: "https://api.card.ly",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "API-Key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
