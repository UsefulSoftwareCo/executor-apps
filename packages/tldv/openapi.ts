import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./spec.json" with { type: "json" };

// spec.json is tl;dv's official OpenAPI document, taken unchanged from the prerendered
// Redoc page at https://doc.tldv.io/ (the vendor publishes no standalone spec URL).
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://pasta.tldv.io",
  securitySchemes: { "Api Key Authentication": { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "Api Key Authentication", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
