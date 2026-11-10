import type { OpenapiToolNamesOptions } from "apps/openapi";

// MongoDB's official Atlas Administration API (v2) document. It declares two schemes: HTTP Digest
// (API key pairs, not supported here) and OAuth 2.0 client credentials for Atlas service accounts.
// The service-account access token is sent as a bearer token.
export const options = {
  source: { url: "https://www.mongodb.com/docs/api/doc/atlas-admin-api-v2.json" },
  allowedOrigin: "https://cloud.mongodb.com",
  securitySchemes: { ServiceAccounts: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ ServiceAccounts: [] }],
  methods: {
    serviceAccount: [{ scheme: "ServiceAccounts", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
