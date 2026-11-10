import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.ocean.io/openapi.json" },
  allowedOrigin: "https://api.ocean.io",
  // The published document declares no security scheme or per-operation security; every operation accepts the token in x-api-token.
  securitySchemes: {
    apiToken: { type: "apiKey", in: "header", name: "x-api-token" },
  },
  fallbackSecurity: [{ apiToken: [] }],
  methods: { apiKey: [{ scheme: "apiToken", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
