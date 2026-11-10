import type { OpenapiToolNamesOptions } from "apps/openapi";

// The spec's only scheme is bearer (JWT); personal access tokens and OAuth access tokens are both sent as bearer.
export const options = {
  source: { url: "https://app.salesmessage.com/api/docs/salesmessage-public-api-v2.3.json" },
  allowedOrigin: "https://api.salesmessage.com",
  securitySchemes: { apiAuth: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ apiAuth: [] }],
  methods: {
    token: [{ scheme: "apiAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "apiAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
  // Public operations keep no security (catalog/status/salesmsg.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1oauth~1token/post/security", value: [] },
    { op: "add", path: "/paths/~1oauth~1token~1refresh/post/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;
