import type { OpenapiToolNamesOptions } from "apps/openapi";

// The document declares the private and public API keys (X-Api-Token header), the shop_domain query
// parameter, and an OAuth bearer scheme. OAuth tokens identify the shop themselves.
export const options = {
  source: { url: "https://judge.me/api/docs.yaml" },
  allowedOrigin: "https://api.judge.me",
  securitySchemes: {
    PrivateAPIKey: { type: "apiKey", in: "header", name: "X-Api-Token" },
    PublicAPIKey: { type: "apiKey", in: "header", name: "X-Api-Token" },
    ShopDomain: { type: "apiKey", in: "query", name: "shop_domain" },
    OAuthAPIKey: {
      type: "oauth2",
      flows: {
        authorizationCode: {
          authorizationUrl: "https://app.judge.me/oauth/authorize",
          tokenUrl: "https://judge.me/oauth/token",
          scopes: {},
        },
      },
    },
  },
  methods: {
    apiKey: [
      { scheme: "PrivateAPIKey", field: "token", part: "value", prefix: "" },
      { scheme: "PublicAPIKey", field: "token", part: "value", prefix: "" },
      { scheme: "ShopDomain", field: "shopDomain", part: "value", prefix: "" },
    ],
  },
  oauth: ["OAuthAPIKey"],
} satisfies OpenapiToolNamesOptions;
