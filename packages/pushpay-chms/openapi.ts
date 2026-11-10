import type { OpenapiToolNamesOptions } from "apps/openapi";

// Pushpay's official ChMS v2 OpenAPI document. Its oauth2 URLs are relative to the API host, so
// they are declared absolutely here (and again on the provider).
export const options = {
  source: { url: "https://docs.pushpay.io/chms-v2/openapi/chms-api-specs.json" },
  allowedOrigin: "https://api.ccbchurch.com",
  securitySchemes: {
    BearerTokenHeader: { type: "http", scheme: "bearer" },
    oauth2: {
      type: "oauth2",
      flows: {
        authorizationCode: {
          authorizationUrl: "https://oauth.ccbchurch.com/oauth/authorize",
          tokenUrl: "https://api.ccbchurch.com/oauth/token",
          scopes: {},
        },
      },
    },
  },
  methods: {},
  oauth: ["oauth2", "BearerTokenHeader"],
} satisfies OpenapiToolNamesOptions;
