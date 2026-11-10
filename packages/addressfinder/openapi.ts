import type { OpenapiToolNamesOptions } from "apps/openapi";

// The document declares only a bearer scheme (for OAuth client credentials tokens) and a required
// `key` query parameter on every operation. The API secret travels raw in the Authorization header.
export const options = {
  source: { url: "https://addressfinder.com/au/docs/assets/files/api-370f54b3282fbc9098436cfde8100581.yaml" },
  allowedOrigin: "https://api.addressfinder.io",
  securitySchemes: {
    apiSecret: { type: "apiKey", in: "header", name: "Authorization" },
    bearerAuth: { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: [{ apiSecret: [] }],
  methods: {
    apiKey: [{ scheme: "apiSecret", field: "secret", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearerAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
