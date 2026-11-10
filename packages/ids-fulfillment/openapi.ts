import type { OpenapiToolNamesOptions } from "apps/openapi";

// The IDS Public API document declares no security scheme and no servers; the key is listed as a
// plain `ApiKey` header parameter on every operation, so we declare the scheme ourselves.
export const options = {
  source: { url: "https://api.idsfulfillment.com/swagger/v1/swagger.json" },
  baseUrl: "https://api.idsfulfillment.com",
  allowedOrigin: "https://api.idsfulfillment.com",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "ApiKey" } },
  fallbackSecurity: [{ apiKey: [] }],
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
