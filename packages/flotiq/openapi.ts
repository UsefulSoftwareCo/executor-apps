import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// Flotiq generates its OpenAPI schema per account (it needs an API key and lists the account's own content
// types), so there is no public document. openapi.json is derived from the official full-schema example in
// flotiq.com/docs/API/open-api-schema: the per-content-type endpoints of the sample `_media` type are
// generalised to /api/v1/content/{contentType}. See README.md.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.flotiq.com",
  securitySchemes: { HeaderApiKeyAuth: { type: "apiKey", in: "header", name: "X-AUTH-TOKEN" } },
  methods: { apiKey: [{ scheme: "HeaderApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
