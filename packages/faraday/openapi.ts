import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://faraday.ai/api.json" },
  allowedOrigin: "https://api.faraday.ai",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
