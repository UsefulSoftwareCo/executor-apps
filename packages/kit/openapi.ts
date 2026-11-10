import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developers.kit.com/api-reference/v4.json" },
  allowedOrigin: "https://api.kit.com",
  securitySchemes: {
    "API Key": { type: "apiKey", in: "header", name: "X-Kit-Api-Key" },
    OAuth2: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [{ scheme: "API Key", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "OAuth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
