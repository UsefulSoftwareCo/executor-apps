import type { OpenapiToolNamesOptions } from "apps/openapi";

// The Management API document declares no security schemes; every operation takes a bearer token.
// The token is minted from the client id and secret in index.ts and swapped in by a fetch wrapper,
// so the placeholder credential below is replaced before the request leaves.
export const options = {
  source: { url: "https://api.devcycle.com/swagger.json" },
  allowedOrigin: "https://api.devcycle.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    clientCredentials: [{ scheme: "bearer", field: "clientId", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
