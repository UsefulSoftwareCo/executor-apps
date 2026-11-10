import type { OpenapiToolNamesOptions } from "apps/openapi";

// Okta's official Admin Management API OpenAPI 3.0 document (https://github.com/okta/okta-management-openapi-spec).
// Its only server is https://{yourOktaDomain}, so index.ts pins each account's own Okta domain.
export const placeholderOrigin = "https://subdomain.okta.com";

export const options = {
  source: {
    url: "https://raw.githubusercontent.com/okta/okta-management-openapi-spec/master/dist/current/management-minimal.yaml",
  },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  // The document declares an `apiToken` header scheme (Authorization: SSWS <token>) and an `oauth2` scheme
  // (Authorization: Bearer <access token>). Both are sent in the Authorization header with their own prefix.
  securitySchemes: {
    apiToken: { type: "http", scheme: "bearer" },
    oauth2: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiToken: [{ scheme: "apiToken", field: "token", part: "value", prefix: "SSWS " }],
    accessToken: [{ scheme: "oauth2", field: "token", part: "value", prefix: "Bearer " }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
