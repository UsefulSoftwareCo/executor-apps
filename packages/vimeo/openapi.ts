import type { OpenapiToolNamesOptions } from "apps/openapi";

// Vimeo's current spec is only served to authenticated callers, so this uses the
// official vimeo/openapi repository (archived December 2023). Its OAuth URLs are
// relative and every operation accepts a bearer token, so "oauth2" is declared as bearer.
export const options = {
  source: { url: "https://raw.githubusercontent.com/vimeo/openapi/master/api.yaml" },
  allowedOrigin: "https://api.vimeo.com",
  securitySchemes: { oauth2: { type: "http", scheme: "bearer" } },
  methods: {
    token: [{ scheme: "oauth2", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
