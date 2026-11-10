import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://hunter.io/openapi.json" },
  allowedOrigin: "https://api.hunter.io",
  securitySchemes: { apiKeyHeader: { type: "apiKey", in: "header", name: "X-API-KEY" } },
  methods: { apiKey: [{ scheme: "apiKeyHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
