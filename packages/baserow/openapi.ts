import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.baserow.io/api/schema.json" },
  allowedOrigin: "https://api.baserow.io",
  baseUrl: "https://api.baserow.io",
  securitySchemes: { "Database token": { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ "Database token": [] }],
  methods: { apiKey: [{ scheme: "Database token", field: "token", part: "value", prefix: "Token " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
