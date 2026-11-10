import type { OpenapiToolNamesOptions } from "apps/openapi";

// Square's published document is OpenAPI 3.0 with an OAuth scheme and a client-secret scheme;
// both personal access tokens and OAuth access tokens are sent as `Authorization: Bearer <token>`.
export const options = {
  source: {
    url: "https://raw.githubusercontent.com/square/connect-api-specification/master/api.json",
  },
  allowedOrigin: "https://connect.squareup.com",
  securitySchemes: { oauth2: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ oauth2: [] }],
  methods: {
    token: [{ scheme: "oauth2", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
