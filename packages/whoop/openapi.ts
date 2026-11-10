import type { OpenapiToolNamesOptions } from "apps/openapi";

// WHOOP's document declares an authorization-code OAuth scheme and a partner client-credentials one;
// users sign in with the former, so every operation takes the bearer access token.
export const options = {
  source: { url: "https://api.prod.whoop.com/developer/doc/openapi.json" },
  allowedOrigin: "https://api.prod.whoop.com",
  securitySchemes: { OAuth: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ OAuth: [] }],
  methods: {
    oauth: [{ scheme: "OAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
