import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developer.affinity.co/api-reference/openapi.json" },
  allowedOrigin: "https://api.affinity.co",
  securitySchemes: { apiKeyAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "apiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
