import type { OpenapiToolNamesOptions } from "apps/openapi";

// Telnyx's description declares a bearer scheme per product area (all the same API key or OAuth
// access token) plus an OAuth scheme; every operation is served from one origin.
export const options = {
  source: { url: "https://raw.githubusercontent.com/team-telnyx/openapi/master/openapi/spec3.json" },
  allowedOrigin: "https://api.telnyx.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearerAuth: [] }],
  methods: {
    apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearerAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
