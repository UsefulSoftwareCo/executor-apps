import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.droptocdn.com/v1/openapi.json" },
  allowedOrigin: "https://api.droptocdn.com",
  securitySchemes: { apiKeyAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "apiKeyAuth", field: "token", part: "value", prefix: "Bearer " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
