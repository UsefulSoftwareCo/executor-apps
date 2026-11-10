import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.lusha.com/openapi.json" },
  allowedOrigin: "https://api.lusha.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", name: "api_key", in: "header" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
