import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.glyphic.ai/openapi.json" },
  baseUrl: "https://api.glyphic.ai",
  allowedOrigin: "https://api.glyphic.ai",
  securitySchemes: { APIKeyHeader: { type: "apiKey", in: "header", name: "X-API-Key" } },
  methods: { apiKey: [{ scheme: "APIKeyHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
