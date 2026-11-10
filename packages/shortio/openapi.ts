import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.short.io/openapi.json" },
  allowedOrigin: "https://api.short.io",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
