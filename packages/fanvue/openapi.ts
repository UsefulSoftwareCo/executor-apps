import type { OpenapiToolNamesOptions } from "apps/openapi";

// Fanvue's official OpenAPI 3.1 document declares one OAuth2 scheme (BearerAuth); the access token
// is sent as a bearer token. Every operation requires an X-Fanvue-API-Version header; index.ts supplies it through parameterDefaults.
export const options = {
  source: { url: "https://api.fanvue.com/docs/openapi.json" },
  allowedOrigin: "https://api.fanvue.com",
  baseUrl: "https://api.fanvue.com",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ BearerAuth: [] }],
  methods: {
    oauth: [{ scheme: "BearerAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
