import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.ragie.ai/openapi.json" },
  allowedOrigin: "https://api.ragie.ai",
  securitySchemes: { auth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "auth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
