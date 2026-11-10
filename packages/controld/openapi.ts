import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// openapi.json merges the per-endpoint OpenAPI definitions embedded in the reference pages at
// https://docs.controld.com/reference/ (ReadMe publishes no single document).
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.controld.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
