import type { OpenapiToolNamesOptions } from "apps/openapi";

// Ramp's official Developer API document. The spec declares one OAuth 2.0 scheme named
// "oauth2"; every access token (client credentials or authorization code) is sent as a bearer token.
export const options = {
  source: { url: "https://docs.ramp.com/openapi/developer-api.json" },
  allowedOrigin: "https://api.ramp.com",
  securitySchemes: { oauth2: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ oauth2: [] }],
  methods: {
    clientCredentials: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }],
    oauth: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
  // Token mint/revoke use HTTP Basic client credentials, not the injected bearer token.
  patches: [
    { op: "remove", path: "/paths/~1developer~1v1~1token" },
    { op: "remove", path: "/paths/~1developer~1v1~1token~1revoke" },
  ],
} satisfies OpenapiToolNamesOptions;
