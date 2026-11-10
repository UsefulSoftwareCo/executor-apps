import type { OpenapiToolNamesOptions } from "apps/openapi";

// Mattermost's official OpenAPI 3.0 document, published in the mattermost-developer-documentation repository (the
// source of developers.mattermost.com/api-documentation). Its server is a user variable defaulting to localhost, so
// index.ts pins each account's own Mattermost origin. Paths already include /api/v4.
export const placeholderOrigin = "https://mattermost.example.com";

export const options = {
  source: {
    url: "https://raw.githubusercontent.com/mattermost/mattermost-developer-documentation/master/site/static/mattermost-openapi-v4.yaml",
  },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" }, BearerAuth: { type: "http", scheme: "bearer" } },
  methods: {
    apiKey: [
      { scheme: "bearerAuth", field: "token", part: "value", prefix: "" },
      { scheme: "BearerAuth", field: "token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
