import type { OpenapiToolNamesOptions } from "apps/openapi";

// Auth0's official Management API v2 OpenAPI 3.1 document (linked from https://auth0.com/docs/api/management/v2).
// Its only server is https://{tenantDomain}/api/v2, so index.ts pins each account's own tenant domain.
export const placeholderOrigin = "https://tenant.auth0.com";

export const options = {
  source: { url: "https://auth0.com/docs/oas/management/v2/management-api-oas.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/api/v2`,
  // The document declares a bearer scheme (and a client-credentials scheme whose token URL is relative to the
  // tenant). The client-credentials token is minted in index.ts, so both methods fill the bearer scheme.
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: {
    clientCredentials: [{ scheme: "bearerAuth", field: "clientSecret", part: "value", prefix: "" }],
    token: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
