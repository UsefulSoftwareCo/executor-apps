import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// Manatal publishes no single downloadable document. openapi.json is Manatal's own Open API v3
// definition, merged from the per-operation OpenAPI fragments embedded in each reference page at
// https://developers.manatal.com (authentication: `Authorization: Token <key>`).
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.manatal.com",
  securitySchemes: { api_key: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "Token " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
