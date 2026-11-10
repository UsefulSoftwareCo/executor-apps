import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://saas-api.tmprl.cloud/spec.json" },
  allowedOrigin: "https://saas-api.tmprl.cloud",
  securitySchemes: { ApiKey: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "ApiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
