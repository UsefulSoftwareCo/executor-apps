import type { OpenapiToolNamesOptions } from "apps/openapi";

// Gitea's official Swagger 2.0 document, served by every instance at /swagger.v1.json. The
// gitea.com copy is the same API surface; index.ts points calls at the account's own instance.
export const placeholderOrigin = "https://gitea.com";

export const options = {
  source: { url: `${placeholderOrigin}/swagger.v1.json` },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/api/v1`,
  // The spec's AuthorizationHeaderToken scheme: `Authorization: token <access token>`.
  securitySchemes: { AuthorizationHeaderToken: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: {
    token: [{ scheme: "AuthorizationHeaderToken", field: "token", part: "value", prefix: "token " }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
