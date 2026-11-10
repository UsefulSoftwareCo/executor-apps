import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// BigMailer publishes its OpenAPI definition only per operation, embedded in each page of
// docs.bigmailer.io/reference. openapi.json is those 80 official definitions merged unchanged
// (paths and components unioned, one security requirement added for the X-API-Key scheme).
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.bigmailer.io",
  securitySchemes: { APIKey: { type: "apiKey", in: "header", name: "X-API-Key" } },
  methods: { apiKey: [{ scheme: "APIKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
