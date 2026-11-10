import type { OpenapiToolNamesOptions } from "apps/openapi";

// Greenhouse's official Harvest v3 OpenAPI document (listed at https://harvestdocs.greenhouse.io/openapi).
// Operations accept a bearer JWT; the OAuth client credentials grant yields it as access_token.
// The bulk operations declare only the oauth2 scheme, so it is redeclared as bearer too.
export const options = {
  source: { url: "https://harvestdocs.greenhouse.io/openapi/harvest-api.json" },
  allowedOrigin: "https://harvest.greenhouse.io",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" }, oauth2: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    oauth: [
      { scheme: "bearer", field: "access_token", part: "value", prefix: "" },
      { scheme: "oauth2", field: "access_token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
