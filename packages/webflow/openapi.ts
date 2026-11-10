import type { OpenapiToolNamesOptions } from "apps/openapi";

// Every operation declares only the spec's OAuth2 scheme (with scopes), but Webflow accepts
// OAuth access tokens and site/workspace API tokens alike as bearer tokens. Both schemes are
// therefore treated as bearer so each operation is callable with either kind of account.
export const options = {
  source: { url: "https://raw.githubusercontent.com/webflow/openapi-spec/main/openapi/v2.yml" },
  allowedOrigin: "https://api.webflow.com",
  securitySchemes: {
    ApiKey: { type: "http", scheme: "bearer" },
    OAuth2: { type: "http", scheme: "bearer" },
  },
  methods: {
    token: [
      { scheme: "ApiKey", field: "token", part: "value", prefix: "" },
      { scheme: "OAuth2", field: "token", part: "value", prefix: "" },
    ],
    oauth: [
      { scheme: "ApiKey", field: "access_token", part: "value", prefix: "" },
      { scheme: "OAuth2", field: "access_token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
