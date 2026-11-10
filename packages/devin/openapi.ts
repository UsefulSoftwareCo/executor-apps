import type { OpenapiToolNamesOptions } from "apps/openapi";

// The v3 document declares no servers; every operation lives on api.devin.ai.
export const options = {
  source: { url: "https://docs.devin.ai/v3-openapi.json" },
  baseUrl: "https://api.devin.ai",
  allowedOrigin: "https://api.devin.ai",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
