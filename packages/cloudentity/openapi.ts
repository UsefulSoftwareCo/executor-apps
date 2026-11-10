import type { OpenapiToolNamesOptions } from "apps/openapi";

// Cloudentity's official Admin API Swagger 2.0 document, published in the vendor's cloudentity/acp-client-go
// repository (the spec the official Go client is generated from). Its host and base path are placeholders
// (localhost:8443, /api/admin/default), so index.ts pins each account's own tenant host and tenant ID.
export const placeholderOrigin = "https://tenant.us.authz.cloudentity.io";

export const options = {
  source: { url: "https://raw.githubusercontent.com/cloudentity/acp-client-go/b8f2a1b4bb591217fcf0be2e5951e9418edc0ba5/spec/admin.yaml" },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/api/admin/tenant`,
  // The document declares one oauth2 scheme named admin. The token is minted in index.ts from the account's
  // client credentials (the token endpoint is on the tenant host), so the scheme is filled as a bearer header.
  securitySchemes: { admin: { type: "http", scheme: "bearer" } },
  methods: {
    clientCredentials: [{ scheme: "admin", field: "clientSecret", part: "value", prefix: "" }],
    token: [{ scheme: "admin", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
