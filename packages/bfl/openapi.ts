import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.bfl.ai/openapi.json" },
  allowedOrigin: "https://api.bfl.ai",
  securitySchemes: { APIKeyHeader: { type: "apiKey", in: "header", name: "x-key" } },
  methods: { apiKey: [{ scheme: "APIKeyHeader", field: "token", part: "value", prefix: "" }] },
  fallbackSecurity: [{ APIKeyHeader: [] }],
  oauth: [],
} satisfies OpenapiToolNamesOptions;
