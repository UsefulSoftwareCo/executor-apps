import type { OpenapiToolNamesOptions } from "apps/openapi";

// Tripletex's official OpenAPI 3.0 document, served by the API itself.
export const options = {
  source: { url: "https://tripletex.no/v2/openapi.json" },
  allowedOrigin: "https://tripletex.no",
  securitySchemes: { tokenAuthScheme: { type: "http", scheme: "basic" } },
  // Every operation requires Basic auth, so the scheme is bound to the account fields. The real
  // credentials ("0:<session token>") replace this header in index.ts after the token exchange.
  methods: {
    apiKey: [
      { scheme: "tokenAuthScheme", field: "consumerToken", part: "username", prefix: "" },
      { scheme: "tokenAuthScheme", field: "employeeToken", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
