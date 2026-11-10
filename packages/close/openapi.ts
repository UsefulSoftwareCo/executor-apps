import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developer.close.com/openapi.yaml" },
  allowedOrigin: "https://api.close.com",
  securitySchemes: {
    ApiKeyAuth: { type: "http", scheme: "basic" },
    OAuth2: { type: "http", scheme: "bearer" },
  },
  // An API key is the Basic username with an empty password.
  methods: {
    apiKey: [
      { scheme: "ApiKeyAuth", field: "token", part: "username", prefix: "" },
    ],
    oauth: [{ scheme: "OAuth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
