import type { OpenapiToolNamesOptions } from "apps/openapi";

// Netlify's official Swagger 2.0 description. Every operation requires its `netlifyAuth` scheme,
// declared there as an implicit OAuth flow; it is redefined as a bearer scheme here because both
// personal access tokens and OAuth access tokens are sent as `Authorization: Bearer`.
export const options = {
  source: { url: "https://open-api.netlify.com/swagger.json" },
  allowedOrigin: "https://api.netlify.com",
  securitySchemes: { netlifyAuth: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ netlifyAuth: [] }],
  methods: {
    token: [{ scheme: "netlifyAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "netlifyAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
