import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.customgpt.ai/openapi/openapi.json" },
  allowedOrigin: "https://app.customgpt.ai",
  securitySchemes: { BearerToken: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerToken", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
