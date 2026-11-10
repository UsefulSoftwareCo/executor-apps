import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.unione.io/openapi/unione-web-api-latest.json" },
  allowedOrigin: "https://api.unione.io",
  securitySchemes: {
    apiKeyAuth: { type: "apiKey", name: "X-API-KEY", in: "header" },
  },
  methods: { apiKey: [{ scheme: "apiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
