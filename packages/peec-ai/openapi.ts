import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.peec.ai/customer/v1/openapi/json" },
  allowedOrigin: "https://api.peec.ai",
  securitySchemes: { APIKeyHeader: { type: "apiKey", in: "header", name: "X-API-Key" } },
  methods: { apiKey: [{ scheme: "APIKeyHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
