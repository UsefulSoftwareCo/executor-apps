import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://app.mailcheck.co/openapi.json" },
  allowedOrigin: "https://api.mailcheck.co",
  securitySchemes: { "API key": { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "API key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
