import type { OpenapiToolNamesOptions } from "apps/openapi";

// Sidetracker's description declares no servers and names its scheme "tokenAuth" in the
// components but "TokenAuth" on operations; both map to `Authorization: Token <key>`.
// The two inbound webhook receivers (Calendly, Pipedrive) are called by those vendors, not by users.
export const options = {
  source: { url: "https://app.sidetracker.io/api/schema" },
  allowedOrigin: "https://app.sidetracker.io",
  baseUrl: "https://app.sidetracker.io",
  securitySchemes: {
    tokenAuth: { type: "apiKey", in: "header", name: "Authorization" },
    TokenAuth: { type: "apiKey", in: "header", name: "Authorization" },
  },
  fallbackSecurity: [{ TokenAuth: [] }],
  methods: { apiKey: [{ scheme: "TokenAuth", field: "token", part: "value", prefix: "Token " }] },
  oauth: [],
  patches: [
    { op: "remove", path: "/paths/~1api~1integrations~1calendly~1webhook~1{webhook_secret}~1" },
    { op: "remove", path: "/paths/~1api~1integrations~1pipedrive~1webhook~1{webhook_secret}~1" },
  ],
} satisfies OpenapiToolNamesOptions;
