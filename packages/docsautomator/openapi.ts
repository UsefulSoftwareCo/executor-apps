import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docsautomator.co/docs/openapi.json" },
  allowedOrigin: "https://api.docsautomator.co",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
