import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// openapi.json is the Drata API v2 definition published on https://developers.drata.com/openapi/reference/v2/
// (its "Download OpenAPI specification" link), bundled unchanged: the docs offer no stable URL for it.
// The definition lists the US, EU and APAC servers; this package uses the US one.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://public-api.drata.com",
  baseUrl: "https://public-api.drata.com/public/v2",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
