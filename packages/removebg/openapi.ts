import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://www.remove.bg/api/swagger.yaml" },
  allowedOrigin: "https://api.remove.bg",
  securitySchemes: {
    APIKeyHeader: { type: "apiKey", name: "X-API-Key", in: "header" },
  },
  methods: { apiKey: [{ scheme: "APIKeyHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
