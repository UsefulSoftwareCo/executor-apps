import type { OpenapiToolNamesOptions } from "apps/openapi";

// Postiz sends the key (or OAuth access token) as the raw Authorization header value, no prefix.
export const options = {
  source: { url: "https://docs.postiz.com/public-api/openapi.json" },
  allowedOrigin: "https://api.postiz.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: {
    apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "ApiKeyAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
