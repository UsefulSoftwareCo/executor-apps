import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://www.intelliprint.net/openapi.json" },
  allowedOrigin: "https://api.intelliprint.net",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
