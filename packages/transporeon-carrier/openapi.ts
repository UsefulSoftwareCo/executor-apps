import type { OpenapiToolNamesOptions } from "apps/openapi";

// Transporeon's official OpenAPI 3.1 document lists a Production and a Test server. Basic auth and OAuth 2.0
// client credentials (scope carrierintegration) are both documented; index.ts picks the origin from the account's
// auth method, so the test host is its own pair of methods (basicTest, oauthTest).
export const environments = {
  production: { origin: "https://xp.transporeon.com", api: "/carrier_interface/openapi", tokenUrl: "https://api.transporeon.com/oauth2/token" },
  test: { origin: "https://xp.test.transporeon.com", api: "/carrier_interface/openapi", tokenUrl: "https://api.test.transporeon.com/oauth2/token" },
} as const;

export const options = {
  source: { url: "https://xch.transporeon.com/carrier_interface/openapi/v1/swagger.json" },
  allowedOrigin: environments.production.origin,
  securitySchemes: {
    basic: { type: "http", scheme: "basic" },
    bearer: { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: [{ basic: [] }, { bearer: [] }] as const,
  methods: {
    basic: [
      { scheme: "basic", field: "username", part: "username", prefix: "" },
      { scheme: "basic", field: "password", part: "password", prefix: "" },
    ],
    basicTest: [
      { scheme: "basic", field: "username", part: "username", prefix: "" },
      { scheme: "basic", field: "password", part: "password", prefix: "" },
    ],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
    oauthTest: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
