import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.renderform.io/openapi/docs" },
  allowedOrigin: "https://api.renderform.io",
  securitySchemes: { apiKey: { type: "apiKey", name: "x-api-key", in: "header" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ apiKey: [] }],
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
