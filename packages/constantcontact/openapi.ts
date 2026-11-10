import type { OpenapiToolNamesOptions } from "apps/openapi";

// Constant Contact's official V3 document is Swagger 2.0 and declares OAuth 2.0 (implicit and
// access code) plus an `x-api-key` scheme. Operations require either OAuth scheme, so both map to
// the same bearer token obtained through the authorization code flow.
export const options = {
  source: { url: "https://api.cc.email/v3/swagger.yaml" },
  allowedOrigin: "https://api.cc.email",
  securitySchemes: {
    oauth2_implicit: { type: "http", scheme: "bearer" },
    oauth2_access_code: { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: [{ oauth2_access_code: [] }],
  methods: {
    oauth: [
      { scheme: "oauth2_access_code", field: "access_token", part: "value", prefix: "" },
      { scheme: "oauth2_implicit", field: "access_token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
