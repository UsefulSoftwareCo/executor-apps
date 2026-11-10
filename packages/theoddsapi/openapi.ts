import type { OpenapiToolNamesOptions } from "apps/openapi";

// The vendor's official OpenAPI 3.0.1 document. It declares no security scheme: every operation takes a
// required `apiKey` query parameter, which index.ts fills from the account via parameterDefaults.
export const options = {
  source: { url: "https://the-odds-api.com/api-reference/v4/schema.yml" },
  allowedOrigin: "https://api.the-odds-api.com",
  securitySchemes: { apiKey: { type: "apiKey", in: "query", name: "apiKey" } },
  fallbackSecurity: [{ apiKey: [] }],
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
