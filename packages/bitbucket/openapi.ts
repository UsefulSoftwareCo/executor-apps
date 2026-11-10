import type { OpenapiToolNamesOptions } from "apps/openapi";

// Atlassian's official Swagger 2.0 description of the Bitbucket Cloud REST API 2.0.
export const options = {
  source: { url: "https://api.bitbucket.org/swagger.json" },
  allowedOrigin: "https://api.bitbucket.org",
  securitySchemes: {
    basic: { type: "http", scheme: "basic" },
    oauth2: { type: "http", scheme: "bearer" },
  },
  methods: {
    // Atlassian account email plus an API token, sent as HTTP Basic.
    apiToken: [
      { scheme: "basic", field: "email", part: "username", prefix: "" },
      { scheme: "basic", field: "token", part: "password", prefix: "" },
    ],
    // Repository, project or workspace access token, sent as a bearer token.
    accessToken: [{ scheme: "oauth2", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
