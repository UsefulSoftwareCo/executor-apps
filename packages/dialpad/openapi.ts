import type { OpenapiToolNamesOptions } from "apps/openapi";

// Dialpad's own OpenAPI 3.1 document (Admin API v2), published at dialpad.com/static/openapi.
// It declares an API key (query or bearer); OAuth access tokens are sent as the same bearer.
export const options = {
  source: {
    url: "https://dialpad.com/static/openapi/platform-v1.0.json",
  },
  allowedOrigin: "https://dialpad.com",
  securitySchemes: { bearer_token: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer_token: [] }],
  methods: {
    apiKey: [{ scheme: "bearer_token", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer_token", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
