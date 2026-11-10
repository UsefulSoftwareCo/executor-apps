import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://simplero.com/api/v2/docs/openapi.json" },
  allowedOrigin: "https://simplero.com",
  securitySchemes: { apiKeyHeader: { type: "apiKey", in: "header", name: "X-API-Key" } },
  methods: { apiKey: [{ scheme: "apiKeyHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
