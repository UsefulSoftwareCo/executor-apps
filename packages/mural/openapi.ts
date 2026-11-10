import type { OpenapiToolNamesOptions } from "apps/openapi";

// The definition's server URL carries a {version} variable, so the base URL is pinned to v1.
export const options = {
  source: { url: "https://dash.readme.com/api/v1/api-registry/8djxl91kmmnrxkk6" },
  allowedOrigin: "https://app.mural.co",
  baseUrl: "https://app.mural.co/api/public/v1",
  securitySchemes: { oauth2: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ oauth2: [] }],
  methods: {
    oauth: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
