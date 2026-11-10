import type { OpenapiToolNamesOptions } from "apps/openapi";

// ShipBob's official OpenAPI 3.0 document for the 2026-07 API version (linked from developer.shipbob.com).
// The document lists production and sandbox servers; index.ts picks the origin per account.
export const productionOrigin = "https://api.shipbob.com";
export const sandboxOrigin = "https://sandbox-api.shipbob.com";

export const options = {
  source: { url: "https://marketplaceapi.shipbob.com/docs/2026-07.json" },
  allowedOrigin: productionOrigin,
  baseUrl: productionOrigin,
  securitySchemes: { PAT: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ PAT: [] }],
  methods: { token: [{ scheme: "PAT", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
