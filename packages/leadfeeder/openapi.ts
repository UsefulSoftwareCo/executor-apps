import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.leadfeeder.com/openapi.yaml" },
  allowedOrigin: "https://api.leadfeeder.com",
  securitySchemes: {
    ApiKeyAuth: { type: "apiKey", in: "header", name: "X-Api-Key" },
    OAuth2: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "OAuth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
