import type { OpenapiToolNamesOptions } from "apps/openapi";

// Slite's own OpenAPI document. It declares an HTTP bearer scheme named "bearer", but Slite's
// authentication guide says the key goes in the `x-slite-api-key` header, so the scheme is
// redeclared here as that header.
export const options = {
  source: { url: "https://api.slite.com/openapi.json" },
  allowedOrigin: "https://api.slite.com",
  securitySchemes: { bearer: { type: "apiKey", in: "header", name: "x-slite-api-key" } },
  methods: { apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
