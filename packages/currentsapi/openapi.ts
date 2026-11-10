import type { OpenapiToolNamesOptions } from "apps/openapi";

// Currents publishes an official Swagger 2.0 document; the Authorization header takes the key as "Bearer <key>" or bare.
export const options = {
  source: { url: "https://currentsapi.services/json/swagger.json" },
  allowedOrigin: "https://api.currentsapi.services",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ ApiKeyAuth: [] }],
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "Bearer " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
