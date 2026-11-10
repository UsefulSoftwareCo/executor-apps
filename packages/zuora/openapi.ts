import type { OpenapiToolNamesOptions } from "apps/openapi";

// Zuora's official REST API reference (Swagger 2.0). Its only host is the US Cloud 2 production endpoint, so
// index.ts pins each account's own REST base URL (the tenant's region and environment).
export const placeholderOrigin = "https://rest.zuora.com";

export const options = {
  source: { url: "https://developer.zuora.com/yaml/swagger.yaml" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  // The access token is minted from the account's OAuth client credentials in index.ts, so the document's
  // scheme is filled as a bearer header from the account's client secret field.
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearerAuth: [] }],
  methods: {
    clientCredentials: [{ scheme: "bearerAuth", field: "clientSecret", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
