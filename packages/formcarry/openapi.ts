import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.formcarry.com/docs-json" },
  allowedOrigin: "https://api.formcarry.com",
  securitySchemes: { api_key: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
