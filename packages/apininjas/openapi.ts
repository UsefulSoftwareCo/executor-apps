import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api-ninjas.com/openapi.json" },
  allowedOrigin: "https://api.api-ninjas.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "X-Api-Key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
