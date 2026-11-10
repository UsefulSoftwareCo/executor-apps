import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developers.heymarket.com/api-reference/openapi/heymarket-openapi-3.1.2.yaml" },
  allowedOrigin: "https://api.heymarket.com",
  securitySchemes: {
    ApiSecretJwtAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    LegacyApiKeyAuth: { type: "http", scheme: "bearer" },
  },
  methods: {
    // The bearer value is replaced with a freshly signed JWT in index.ts; secretKey only places the header.
    apiSecret: [{ scheme: "ApiSecretJwtAuth", field: "secretKey", part: "value", prefix: "" }],
    apiKey: [{ scheme: "LegacyApiKeyAuth", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
