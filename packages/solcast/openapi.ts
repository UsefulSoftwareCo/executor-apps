import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.solcast.com.au/openapi/v1/openapi.json" },
  baseUrl: "https://api.solcast.com.au",
  allowedOrigin: "https://api.solcast.com.au",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ bearerAuth: [] }],
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
