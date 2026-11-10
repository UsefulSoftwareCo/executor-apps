import type { OpenapiToolNamesOptions } from "apps/openapi";

// Shopware's official Admin API OpenAPI document, published in the shopware/admin-api-reference repository
// (every shop also serves it at /api/_info/openapi3.json, but only to an authenticated admin). The document's
// only server is the relative /api, so index.ts pins each account's own shop origin.
export const placeholderOrigin = "https://shop.example.com";

export const options = {
  source: { url: "https://raw.githubusercontent.com/shopware/admin-api-reference/main/adminapi.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/api`,
  // The document declares one oauth2 scheme named oAuth. The access token is minted from the account's
  // integration credentials in index.ts (the token endpoint is on the shop's own host, which a static tokenUrl
  // cannot express), so the scheme is filled as a bearer header from the account's token.
  securitySchemes: { oAuth: { type: "http", scheme: "bearer" } },
  methods: {
    clientCredentials: [{ scheme: "oAuth", field: "clientSecret", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
