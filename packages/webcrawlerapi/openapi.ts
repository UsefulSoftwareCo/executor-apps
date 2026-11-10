import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.webcrawlerapi.com/swagger/doc.json" },
  baseUrl: "https://api.webcrawlerapi.com",
  allowedOrigin: "https://api.webcrawlerapi.com",
  securitySchemes: {
    ApiKeyAuth: { type: "apiKey", name: "Authorization", in: "header" },
  },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "Bearer " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
