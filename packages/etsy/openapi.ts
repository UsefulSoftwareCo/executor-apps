import type { OpenapiToolNamesOptions } from "apps/openapi";

// Etsy's document pairs the `x-api-key` header with an OAuth 2.0 bearer token on almost every
// operation. The OAuth scheme is declared as plain bearer here so one credential set fills both.
export const options = {
  source: { url: "https://www.etsy.com/openapi/generated/oas/3.0.0.json" },
  allowedOrigin: "https://openapi.etsy.com",
  securitySchemes: {
    api_key: { type: "apiKey", name: "x-api-key", in: "header" },
    oauth2: { type: "http", scheme: "bearer" },
  },
  methods: {
    token: [
      { scheme: "api_key", field: "apiKey", part: "value", prefix: "" },
      { scheme: "oauth2", field: "accessToken", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
