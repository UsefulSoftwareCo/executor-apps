import type { OpenapiToolNamesOptions } from "apps/openapi";

// NinjaOne's official Public API 2.0 OpenAPI document. It declares no servers; paths start with /v2 and live at the
// root of the tenant's own instance host, which index.ts pins per account.
export const placeholderOrigin = "https://app.ninjarmm.com";

export const options = {
  source: { url: "https://app.ninjarmm.com/apidocs/NinjaRMM-API-v2.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  // The document declares an http bearer scheme named oauth2. The access token is minted from the account's client
  // credentials in index.ts (the token endpoint is on the tenant's instance host), so the scheme is filled as a
  // bearer header from the account's token.
  securitySchemes: { oauth2: { type: "http", scheme: "bearer" } },
  methods: {
    clientCredentials: [{ scheme: "oauth2", field: "clientSecret", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
