import type { OpenapiToolNamesOptions } from "apps/openapi";

// Agiled's published document (served by the product at app.agiled.app/docs) declares no security
// scheme: every operation takes a required `api_token` query parameter and a `Brand` header naming
// the account URL. Both come from the account (see index.ts parameterDefaults).
export const options = {
  source: { url: "https://app.agiled.app/docs" },
  allowedOrigin: "https://my.agiled.app",
  securitySchemes: { apiToken: { type: "apiKey", in: "query", name: "api_token" } },
  fallbackSecurity: [{ apiToken: [] }],
  methods: { apiKey: [{ scheme: "apiToken", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
