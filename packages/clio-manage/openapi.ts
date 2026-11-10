import type { OpenapiToolNamesOptions } from "apps/openapi";

// Clio Manage runs in four isolated regions with the same API; index.ts picks the origin
// from the account's auth method.
export const regions = {
  oauth: "https://app.clio.com",
  oauthEu: "https://eu.app.clio.com",
  oauthCa: "https://ca.app.clio.com",
  oauthAu: "https://au.app.clio.com",
} as const;

export const placeholderOrigin = regions.oauth;

const bearer = [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }] as const;

// The published document declares no security schemes; every operation accepts a bearer token.
export const options = {
  source: { url: "https://docs.developers.clio.com/openapi.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/api/v4`,
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: { oauth: bearer, oauthEu: bearer, oauthCa: bearer, oauthAu: bearer },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
