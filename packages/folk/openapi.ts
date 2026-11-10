import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developer.folk.app/schemas/2025-06-09.json" },
  allowedOrigin: "https://api.folk.app",
  securitySchemes: { bearerApiKeyAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Search endpoints are POST but read-only.
  kinds: { internal_searchPeople: "query", internal_searchCompanies: "query", internal_searchDeals: "query" },
} satisfies OpenapiToolNamesOptions;
