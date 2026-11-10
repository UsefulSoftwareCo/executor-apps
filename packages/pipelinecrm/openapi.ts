import type { OpenapiToolNamesOptions } from "apps/openapi";

// Pipeline CRM's own OpenAPI document, served by the app itself.
export const options = {
  source: { url: "https://app.pipelinecrm.com/openapi.json" },
  allowedOrigin: "https://api.pipelinecrm.com",
  securitySchemes: {
    bearerAuth: { type: "http", scheme: "bearer" },
    appKeyHeader: { type: "apiKey", in: "header", name: "app-key" },
  },
  methods: {
    apiToken: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }],
    legacyApiKey: [
      { scheme: "bearerAuth", field: "apiKey", part: "value", prefix: "" },
      { scheme: "appKeyHeader", field: "appKey", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
