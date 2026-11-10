import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://perigon.io/openapi.json" },
  allowedOrigin: "https://api.perigon.io",
  securitySchemes: { apiKeyAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "apiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
