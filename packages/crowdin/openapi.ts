import type { OpenapiToolNamesOptions } from "apps/openapi";

// Crowdin's published description declares no security schemes; every operation accepts a bearer token.
export const options = {
  source: { url: "https://support.crowdin.com/src/assets/api/crowdin/file-based.yml" },
  allowedOrigin: "https://api.crowdin.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    token: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
