import type { OpenapiToolNamesOptions } from "apps/openapi";

// Nusii's official OpenAPI 3.1 document. It declares TokenAuth (API key sent as
// `Authorization: Token token=<key>`) and OAuthBearer (OAuth 2.0 bearer token).
export const options = {
  source: { url: "https://developer.nusii.com/openapi/v2.yaml" },
  allowedOrigin: "https://app.nusii.com",
  securitySchemes: {
    TokenAuth: { type: "apiKey", in: "header", name: "Authorization" },
    OAuthBearer: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [{ scheme: "TokenAuth", field: "token", part: "value", prefix: "Token token=" }],
    oauth: [{ scheme: "OAuthBearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
