import type { OpenapiToolNamesOptions } from "apps/openapi";

// Vanta's official Manage Vanta API OpenAPI 3.0 document, linked from https://developer.vanta.com/reference/overview.
// It lists the commercial and the Gov server; this package targets the commercial one.
export const options = {
  source: { url: "https://developer.vanta.com/reference/manage-vanta.json" },
  allowedOrigin: "https://api.vanta.com",
  baseUrl: "https://api.vanta.com/v1",
  // The access token is minted in index.ts from the application's client credentials.
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearerAuth: [] }],
  methods: {
    clientCredentials: [{ scheme: "bearerAuth", field: "clientSecret", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
