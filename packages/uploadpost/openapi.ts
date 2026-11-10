import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.upload-post.com/openapi.json" },
  allowedOrigin: "https://api.upload-post.com",
  securitySchemes: {
    ApiKeyAuth: { type: "apiKey", name: "Authorization", in: "header" },
    BearerAuth: { type: "http", scheme: "bearer" },
  },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "Apikey " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
