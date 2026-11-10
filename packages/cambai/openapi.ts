import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.camb.ai/api-reference/endpoint/openapi.json" },
  allowedOrigin: "https://client.camb.ai",
  securitySchemes: {
    APIKeyHeader: { type: "apiKey", in: "header", name: "x-api-key" },
  },
  methods: { apiKey: [{ scheme: "APIKeyHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
