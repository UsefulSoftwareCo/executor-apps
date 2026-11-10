import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://swagger-api.truvera.io/openapi.yaml" },
  baseUrl: "https://api.truvera.io",
  allowedOrigin: "https://api.truvera.io",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
