import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.softr.io/openapi.yaml" },
  allowedOrigin: "https://tables-api.softr.io",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "Softr-Api-Key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // POST /tables/{tableId}/records/search only reads, so it runs without an approval prompt.
  kinds: { searchRecords: "query" },
} satisfies OpenapiToolNamesOptions;
