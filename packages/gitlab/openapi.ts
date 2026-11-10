import type { OpenapiToolNamesOptions } from "apps/openapi";

// GitLab's own generated OpenAPI 3.0 document. Operations accept http bearer, oauth2 or the
// PRIVATE-TOKEN apiKey header.
export const options = {
  source: { url: "https://gitlab.com/gitlab-org/gitlab/-/raw/master/doc/api/openapi/openapi_v3.yaml" },
  allowedOrigin: "https://gitlab.com",
  baseUrl: "https://gitlab.com",
  securitySchemes: {
    apiKey: { type: "apiKey", name: "PRIVATE-TOKEN", in: "header" },
    http: { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: [{ apiKey: [] }],
  methods: {
    token: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "http", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
