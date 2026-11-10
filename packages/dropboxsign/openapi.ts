import type { OpenapiToolNamesOptions } from "apps/openapi";

// Dropbox Sign's official OpenAPI document, maintained in github.com/hellosign/hellosign-openapi.
export const options = {
  source: { url: "https://raw.githubusercontent.com/hellosign/hellosign-openapi/main/openapi.yaml" },
  allowedOrigin: "https://api.hellosign.com",
  securitySchemes: {
    api_key: { type: "http", scheme: "basic" },
    oauth2: { type: "http", scheme: "bearer" },
  },
  // An API key is sent as the Basic username with an empty password.
  methods: {
    apiKey: [{ scheme: "api_key", field: "apiKey", part: "username", prefix: "" }],
    oauth: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
