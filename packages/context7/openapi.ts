import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://context7.com/openapi.json" },
  allowedOrigin: "https://context7.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
