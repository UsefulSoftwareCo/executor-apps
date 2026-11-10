import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.vapi.ai/api-json" },
  allowedOrigin: "https://api.vapi.ai",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
