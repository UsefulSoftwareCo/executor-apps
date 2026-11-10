import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://emailvalidation.io/docs/openapi.yaml" },
  allowedOrigin: "https://api.emailvalidation.io",
  securitySchemes: {
    ApiKeyHeader: { type: "apiKey", name: "apikey", in: "header" },
  },
  methods: { apiKey: [{ scheme: "ApiKeyHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
