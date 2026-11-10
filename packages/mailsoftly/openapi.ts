import type { OpenapiToolNamesOptions } from "apps/openapi";

// The API key goes in Authorization with no "Bearer" prefix; OAuth tokens use "Bearer".
export const options = {
  source: { url: "https://app.mailsoftly.com/developers/openapi.json" },
  allowedOrigin: "https://app.mailsoftly.com",
  securitySchemes: {
    api_key: { type: "apiKey", name: "Authorization", in: "header" },
    oauth2: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
