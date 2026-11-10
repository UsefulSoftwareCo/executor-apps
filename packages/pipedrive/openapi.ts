import type { OpenapiToolNamesOptions } from "apps/openapi";

// Pipedrive's official v1 description (213 operations). Operations accept either the
// `x-api-token` header or an OAuth bearer token.
export const options = {
  source: { url: "https://developers.pipedrive.com/docs/api/v1/openapi.yaml" },
  allowedOrigin: "https://api.pipedrive.com",
  securitySchemes: {
    api_key: { type: "apiKey", in: "header", name: "x-api-token" },
    oauth2: { type: "http", scheme: "bearer" },
  },
  methods: {
    token: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
