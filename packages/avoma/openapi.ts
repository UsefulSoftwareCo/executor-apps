import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// document.json is https://dev.avoma.com/openapi.yml with the shared components from
// https://dev.avoma.com/openapi/components/external.yml merged into components.schemas and
// components.examples (the apps compiler resolves only local refs), those refs rewritten to local
// ones, and the one path written without a leading slash fixed. Nothing else is changed.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.avoma.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
