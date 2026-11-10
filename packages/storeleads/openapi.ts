import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://storeleads.app/specification/api/swagger.yaml" },
  allowedOrigin: "https://storeleads.app",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
