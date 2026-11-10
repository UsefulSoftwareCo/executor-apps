import type { OpenapiToolNamesOptions } from "apps/openapi";

// Factorial's own OpenAPI document (the one its SDKs are generated from). Operations accept either
// an OAuth 2 bearer token or an x-api-key header, as the document declares.
export const options = {
  source: { url: "https://api.factorialhr.com/oas" },
  allowedOrigin: "https://api.factorialhr.com",
  securitySchemes: {
    oauth2: {
      type: "oauth2",
      flows: {
        authorizationCode: {
          authorizationUrl: "https://id.factorialhr.com/oauth/authorize",
          tokenUrl: "https://id.factorialhr.com/api/oauth/token",
          refreshUrl: "https://id.factorialhr.com/api/oauth/token",
          scopes: {},
        },
      },
    },
    apikey: { type: "apiKey", name: "x-api-key", in: "header" },
  },
  methods: { apiKey: [{ scheme: "apikey", field: "token", part: "value", prefix: "" }] },
  oauth: ["oauth2"],
} satisfies OpenapiToolNamesOptions;
