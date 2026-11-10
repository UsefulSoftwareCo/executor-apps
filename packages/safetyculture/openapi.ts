import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// SafetyCulture publishes one OpenAPI definition per endpoint on its developer portal, not a
// combined file. openapi.json is those official per-endpoint definitions merged unchanged
// (see README). The security scheme is declared in the definitions as a bearer token.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.mitti.com",
  baseUrl: "https://api.mitti.com",
  securitySchemes: { BearerAuthentication: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ BearerAuthentication: [] }],
  methods: { apiKey: [{ scheme: "BearerAuthentication", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
