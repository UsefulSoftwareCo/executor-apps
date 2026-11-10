import type { OpenapiToolNamesOptions } from "apps/openapi";

// The spec declares an OAuth flow for most operations (partner apps; users cannot register their
// own client). Personal access tokens are also sent as bearer tokens and carry the same scopes, so
// the flow's scheme is redeclared as bearer and bound to the token.
export const options = {
  source: { url: "https://raw.githubusercontent.com/livesession/livesession-docs/master/api/rest/openapi.yaml" },
  allowedOrigin: "https://api.livesession.io",
  securitySchemes: {
    api_token: { type: "apiKey", name: "Authorization", in: "header" },
    livesession_oauth: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [
      { scheme: "api_token", field: "token", part: "value", prefix: "Bearer " },
      { scheme: "livesession_oauth", field: "token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
