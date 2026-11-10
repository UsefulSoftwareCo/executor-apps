import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://static-assets.crustdata.com/openapi-specs/2025-11-01/crustdata.yaml" },
  allowedOrigin: "https://api.crustdata.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
