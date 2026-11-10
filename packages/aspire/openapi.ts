import type { OpenapiToolNamesOptions } from "apps/openapi";

// Aspire's official External API OpenAPI 3.0 document (the Swagger UI behind the API guide at
// https://guide.youraspire.com/apidocs). The sandbox serves the same API, so one document covers both.
export const productionOrigin = "https://cloud-api.youraspire.com";
export const sandboxOrigin = "https://cloudsandbox-api.youraspire.com";

export const options = {
  source: { url: `${productionOrigin}/swagger/v1/swagger.json` },
  allowedOrigin: productionOrigin,
  baseUrl: productionOrigin,
  // The document declares an http bearer scheme named Bearer. The bearer token is minted from the account's
  // Client ID and secret in index.ts, so the scheme is filled from the minted token by a wrapping fetch; the
  // field named here only satisfies the binding.
  securitySchemes: { Bearer: { type: "http", scheme: "bearer" } },
  methods: {
    apiCredentials: [{ scheme: "Bearer", field: "secret", part: "value", prefix: "" }],
  },
  oauth: [],
  // The token endpoints are handled by index.ts, not exposed as tools.
  patches: [
    { op: "remove", path: "/paths/~1Authorization" },
    { op: "remove", path: "/paths/~1Authorization~1RefreshToken" },
  ],
} satisfies OpenapiToolNamesOptions;
