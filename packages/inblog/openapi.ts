import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://inblog.ai/openapi.json" },
  allowedOrigin: "https://inblog.ai",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
