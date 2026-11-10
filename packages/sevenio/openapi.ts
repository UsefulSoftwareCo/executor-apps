import type { OpenapiToolNamesOptions } from "apps/openapi";

// seven.io's official document (seven-io/api-schemes) declares only an OAuth 2.0 scheme, but every
// endpoint also accepts the API key in the `X-Api-Key` header.
export const options = {
  source: { url: "https://raw.githubusercontent.com/seven-io/api-schemes/master/json/openapi.json" },
  allowedOrigin: "https://gateway.seven.io",
  securitySchemes: {
    apiKey: { type: "apiKey", in: "header", name: "X-Api-Key" },
    oauth2_auth: { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: [{ apiKey: [] }],
  methods: {
    apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "oauth2_auth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
