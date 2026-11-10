import type { OpenapiToolNamesOptions } from "apps/openapi";

// Insightly runs each account on a pod (api.<pod>.insightly.com). index.ts swaps in the account's origin.
export const placeholderOrigin = "https://api.na1.insightly.com";

export const options = {
  // Insightly's own Swagger 2.0 document for API v3.1.
  source: { url: "https://api.na1.insightly.com/v3.1/swagger/docs/v3.1" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  // Insightly takes Basic credentials with the API key as the username and an empty password. Executor
  // fills Basic credentials only from nonempty fields, so index.ts gives the router the encoded
  // "<key>:" and this scheme sends it as the Authorization header, as the health check does.
  securitySchemes: { basic: { type: "apiKey", in: "header", name: "Authorization" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ basic: [] }],
  methods: { apiKey: [{ scheme: "basic", field: "basicCredentials", part: "value", prefix: "Basic " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
