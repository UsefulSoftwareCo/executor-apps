import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.wejam.ai/docs-json" },
  allowedOrigin: "https://api.wejam.ai",
  securitySchemes: { "X-API-KEY": { type: "apiKey", in: "header", name: "X-API-KEY" } },
  methods: { apiKey: [{ scheme: "X-API-KEY", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
