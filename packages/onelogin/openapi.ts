import type { OpenapiToolNamesOptions } from "apps/openapi";

// OneLogin's official OpenAPI 3.0 document, published by OneLogin in the v3 branch of its Java SDK repository
// (https://github.com/onelogin/onelogin-java-sdk). Its only server is https://your-api-subdomain.onelogin.com,
// so index.ts pins each account's own subdomain.
export const placeholderOrigin = "https://your-api-subdomain.onelogin.com";

export const options = {
  source: { url: "https://raw.githubusercontent.com/onelogin/onelogin-java-sdk/v3/api/openapi.yaml" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  // The document declares an OAuth2 client-credentials scheme whose token URL is relative to the tenant.
  // index.ts mints the token itself, so the account fills a bearer scheme.
  securitySchemes: { OAuth2: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ OAuth2: [] }],
  methods: {
    clientCredentials: [{ scheme: "OAuth2", field: "clientSecret", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
