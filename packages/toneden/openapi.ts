import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// ToneDen publishes its reference as one OpenAPI fragment per endpoint at developers.toneden.io;
// document.json is those official fragments merged into a single document.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://www.toneden.io",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    token: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
