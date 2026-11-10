import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.swaggerhub.com/apis/callback24/callback24/1.26" },
  baseUrl: "https://panel.callback24.io/api/v1",
  allowedOrigin: "https://panel.callback24.io",
  securitySchemes: {
    APIKeyHeader: { type: "apiKey", name: "X-API-TOKEN", in: "header" },
  },
  methods: { apiKey: [{ scheme: "APIKeyHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
