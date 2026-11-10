import type { OpenapiToolNamesOptions } from "apps/openapi";

// Airtop's official document declares a bearer scheme named "default" (the API key is the bearer token).
export const options = {
  source: { url: "https://docs.airtop.ai/openapi.json" },
  baseUrl: "https://api.airtop.ai/api",
  allowedOrigin: "https://api.airtop.ai",
  securitySchemes: { default: { type: "http", scheme: "bearer" } },
  methods: {
    apiKey: [{ scheme: "default", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
