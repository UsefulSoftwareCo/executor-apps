import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://sendfox.com/openapi.yaml" },
  allowedOrigin: "https://api.sendfox.com",
  // The spec declares an oauth2 scheme; SendFox accepts both a personal access token and an OAuth access token as a bearer.
  securitySchemes: { oauth2: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ oauth2: [] }],
  methods: {
    token: [{ scheme: "oauth2", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
