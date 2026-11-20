import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://getyoutubetranscript.com/openapi.json" },
  allowedOrigin: "https://getyoutubetranscript.com",
  securitySchemes: { apiKeyHeader: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "apiKeyHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
