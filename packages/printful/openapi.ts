import type { OpenapiToolNamesOptions } from "apps/openapi";

// Printful publishes two official OpenAPI documents: the stable v1 API and the v2 beta API (paths under /v2).
// Both are mounted in index.ts. The documents declare OAuth only; every operation accepts a bearer token.
const credentials = {
  allowedOrigin: "https://api.printful.com",
  securitySchemes: { OAuth: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ OAuth: [] }],
  methods: {
    token: [{ scheme: "OAuth", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
} as const;

export const v1Options = {
  source: { url: "https://developers.printful.com/docs/openapi.json" },
  ...credentials,
} satisfies OpenapiToolNamesOptions;

export const v2Options = {
  source: { url: "https://developers.printful.com/docs/v2-beta/openapi.json" },
  ...credentials,
} satisfies OpenapiToolNamesOptions;

export const options = v1Options;
