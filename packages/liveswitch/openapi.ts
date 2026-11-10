import type { OpenapiToolNamesOptions } from "apps/openapi";

// LiveSwitch's own OpenAPI document. Operations name an `oauth2` scheme (declared there as an Auth0
// implicit flow) with per-operation scopes, but the access token from the authorization-code flow is
// sent as a bearer token, so the scheme is declared as http bearer.
export const options = {
  source: { url: "https://public-api.production.liveswitch.com/swagger/v1/swagger.json" },
  allowedOrigin: "https://public-api.production.liveswitch.com",
  securitySchemes: { oauth2: { type: "http", scheme: "bearer" }, bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    oauth: [
      { scheme: "oauth2", field: "access_token", part: "value", prefix: "" },
      { scheme: "bearer", field: "access_token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
