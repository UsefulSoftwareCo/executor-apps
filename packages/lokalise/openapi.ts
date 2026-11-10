import type { OpenapiToolNamesOptions } from "apps/openapi";

// Lokalise's default-projects document. The separate branch-aware document
// (lokalise-api-with-branches.yml) is not mounted: it adds branch management (list, create,
// retrieve, merge, delete branches) and branch-scoped variants of comments, files and keys
// (paths with a :{branch} segment), none of which are exposed here.
export const options = {
  source: { url: "https://developers.lokalise.com/openapi/lokalise-api-without-branches.yml" },
  allowedOrigin: "https://api.lokalise.com",
  securitySchemes: {
    ApiKeyAuth: { type: "apiKey", in: "header", name: "X-Api-Token" },
    bearer: { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: [{ ApiKeyAuth: [] }],
  methods: {
    apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
