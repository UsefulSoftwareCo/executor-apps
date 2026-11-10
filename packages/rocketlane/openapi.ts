import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./spec.json" with { type: "json" };

// Rocketlane serves one OpenAPI definition per endpoint on developer.rocketlane.com/reference/<endpoint>
// and publishes no combined file, so spec.json is those definitions merged (staging servers dropped).
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.rocketlane.com",
  securitySchemes: { "api-key": { type: "apiKey", name: "api-key", in: "header" } },
  methods: { apiKey: [{ scheme: "api-key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
