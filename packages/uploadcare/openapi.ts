import type { OpenapiToolNamesOptions } from "apps/openapi";

// Uploadcare's official REST API 0.7 OpenAPI 3.1 document.
export const options = {
  source: {
    url: "https://uploadcare.com/docs/openapi/rest-api.json",
  },
  allowedOrigin: "https://api.uploadcare.com",
  securitySchemes: { apiKeyAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "apiKeyAuth", field: "token", part: "value", prefix: "Uploadcare.Simple " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
