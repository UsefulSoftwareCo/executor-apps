import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://magichour.ai/openapi.json" },
  allowedOrigin: "https://api.magichour.ai",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
