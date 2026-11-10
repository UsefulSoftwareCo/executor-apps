import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://redirect.pizza/api-docs/openapi.yaml" },
  allowedOrigin: "https://redirect.pizza",
  securitySchemes: { default: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "default", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
