import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.kadoa.com/openapi" },
  allowedOrigin: "https://api.kadoa.com",
  securitySchemes: {
    ApiKeyAuth: { type: "apiKey", name: "x-api-key", in: "header" },
  },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ ApiKeyAuth: [] }],
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
