import type { OpenapiToolNamesOptions } from "apps/openapi";

// CleverReach's official Swagger 2.0 document for REST API v3, served by its API explorer. Every operation
// takes the access token as an Authorization: Bearer header.
export const options = {
  source: { url: "https://rest.cleverreach.com/v3/explorer/swagger.json" },
  allowedOrigin: "https://rest.cleverreach.com",
  baseUrl: "https://rest.cleverreach.com",
  securitySchemes: { api_key: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ api_key: [] }],
  methods: {
    token: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "api_key", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
