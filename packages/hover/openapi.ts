import type { OpenapiToolNamesOptions } from "apps/openapi";

// Hover's official OpenAPI document, published through the ReadMe API registry behind developers.hover.to.
export const options = {
  source: { url: "https://dash.readme.com/api/v1/api-registry/r1vno9hml86psuk" },
  allowedOrigin: "https://hover.to",
  baseUrl: "https://hover.to",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { oauth: [{ scheme: "bearerAuth", field: "access_token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
