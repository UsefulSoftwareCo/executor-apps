import type { OpenapiToolNamesOptions } from "apps/openapi";

// Connecteam's official OpenAPI document (served by the API host). Operations accept either the
// X-API-KEY header or an OAuth 2.0 client-credentials bearer token. Australian-hosted companies use
// api-au.connecteam.com, which this package does not target.
export const options = {
  source: { url: "https://api.connecteam.com/openapi.json" },
  allowedOrigin: "https://api.connecteam.com",
  securitySchemes: {
    APIKeyHeader: { type: "apiKey", in: "header", name: "X-API-KEY" },
    OAuth2: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [{ scheme: "APIKeyHeader", field: "token", part: "value", prefix: "" }],
    clientCredentials: [{ scheme: "OAuth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
  // Token mint uses HTTP Basic client credentials, not the injected bearer token.
  patches: [{ op: "remove", path: "/paths/~1oauth~1v1~1token" }],
} satisfies OpenapiToolNamesOptions;
