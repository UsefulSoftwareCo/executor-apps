import type { OpenapiToolNamesOptions } from "apps/openapi";

// Checkout.com's official API reference definition. Most operations live on the account's own
// https://{prefix}.api[.sandbox].checkout.com host; index.ts swaps in the origin for the account's environment.
// A few operations (files, forward) use fixed hosts and are left out by the allowed origin.
export const options = {
  source: { url: "https://api-reference.checkout.com/v1/swagger.json" },
  allowedOrigin: "https://example.api.sandbox.checkout.com",
  baseUrl: "https://example.api.sandbox.checkout.com",
  // The OAuth scheme is declared as a bearer token: index.ts mints the token from the access key.
  securitySchemes: {
    ApiSecretKey: { type: "apiKey", in: "header", name: "Authorization" },
    OAuth: { type: "http", scheme: "bearer" },
  },
  methods: {
    secretKey: [{ scheme: "ApiSecretKey", field: "secretKey", part: "value", prefix: "Bearer " }],
    clientCredentials: [{ scheme: "OAuth", field: "clientSecret", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
