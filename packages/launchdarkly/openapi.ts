import type { OpenapiToolNamesOptions } from "apps/openapi";

// LaunchDarkly's ApiKey scheme sends the raw token in the Authorization header, with no "Bearer" prefix;
// OAuth access tokens are sent as bearer tokens.
export const options = {
  source: { url: "https://app.launchdarkly.com/api/v2/openapi.json" },
  allowedOrigin: "https://app.launchdarkly.com",
  securitySchemes: {
    ApiKey: { type: "apiKey", in: "header", name: "Authorization" },
    bearer: { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: [{ ApiKey: [] }],
  methods: {
    apiKey: [{ scheme: "ApiKey", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
