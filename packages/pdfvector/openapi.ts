import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// PDF Vector publishes its OpenAPI document only inline in https://global.pdfvector.com/api/reference,
// so it is vendored here as openapi.json (version 0.4.15).
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://global.pdfvector.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
