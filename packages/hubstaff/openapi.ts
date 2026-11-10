import type { OpenapiToolNamesOptions } from "apps/openapi";

// Hubstaff's official API v2 document (Swagger 2.0), served by the API itself. Its oauth2 scheme is sent as a bearer token.
export const options = {
  source: { url: "https://api.hubstaff.com/v2/docs" },
  allowedOrigin: "https://api.hubstaff.com",
  securitySchemes: { oauth2: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ oauth2: [] }],
  methods: {
    oauth: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
