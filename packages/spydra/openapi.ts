import type { OpenapiToolNamesOptions } from "apps/openapi";

// Spydra's published OpenRWA API definition (linked from docs.spydra.app, Token Store API pages).
// Every operation lists x-api-key and x-store-id as separate alternatives. Whether both are
// required is unverified, so only x-api-key is bound here and index.ts always adds x-store-id.
export const options = {
  source: {
    url: "https://640808362-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F5jDaQI2dLzXe5VgQBNFE%2Fuploads%2F4NaWQzBNKZI4unQ1hOfD%2Frwa-swagger%20(Updated-final).yaml?alt=media&token=3b5719a6-050e-4977-b924-84ce07239267",
  },
  allowedOrigin: "https://api.openrwa.io",
  securitySchemes: { "x-api-key": { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "x-api-key", field: "apiKey", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
