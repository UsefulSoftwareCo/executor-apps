import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://static.hex.site/openapi.json" },
  allowedOrigin: "https://app.hex.tech",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
