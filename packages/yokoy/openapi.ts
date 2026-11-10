import type { OpenapiToolNamesOptions } from "apps/openapi";

// Yokoy's official public API document, referenced from https://developer.yokoy.ai/api-reference/.
// Its servers are https://api[.test].yokoy.ai/v1/organizations/{organizationId}, so index.ts pins each
// account's own environment and organization.
export const placeholderOrigin = "https://api.yokoy.ai";

export const options = {
  source: { url: "https://api.yokoy.ai/v1/swagger.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/v1/organizations/AbcDeF1234`,
  // The document declares an OAuth2 client-credentials scheme. The token is minted in index.ts, so the
  // account's method fills a bearer value.
  securitySchemes: { OAuth2: { type: "http", scheme: "bearer" } },
  methods: {
    clientCredentials: [{ scheme: "OAuth2", field: "clientSecret", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
