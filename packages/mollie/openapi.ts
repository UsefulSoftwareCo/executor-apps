import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://raw.githubusercontent.com/mollie/openapi/main/specs.yaml" },
  allowedOrigin: "https://api.mollie.com",
  securitySchemes: {
    apiKey: { type: "http", scheme: "bearer" },
    advancedAccessToken: { type: "http", scheme: "bearer" },
    oAuth: { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: [{ apiKey: [] }],
  methods: {
    token: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "oAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
