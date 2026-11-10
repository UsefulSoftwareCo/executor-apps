import type { OpenapiToolNamesOptions } from "apps/openapi";

// PayFit's description declares an oauth2 scheme, but API keys and OAuth access tokens are both
// sent as plain bearer tokens, so the scheme is re-declared as bearer.
export const options = {
  source: { url: "https://developers.payfit.io/openapi/partner-api.json" },
  allowedOrigin: "https://partner-api.payfit.com",
  securitySchemes: { "partner-api-oauth": { type: "http", scheme: "bearer" } },
  methods: {
    apiKey: [{ scheme: "partner-api-oauth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "partner-api-oauth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
