import type { OpenapiToolNamesOptions } from "apps/openapi";

// RingCentral's description has a placeholder authorization URL; the real OAuth endpoints live in index.ts.
export const options = {
  source: {
    url: "https://raw.githubusercontent.com/ringcentral/ringcentral-api-docs/main/specs/ringcentral_openapi3.json",
  },
  allowedOrigin: "https://platform.ringcentral.com",
  securitySchemes: { OAuth2: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ OAuth2: [] }],
  methods: {
    oauth: [{ scheme: "OAuth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
