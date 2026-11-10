import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./dovetail.json" with { type: "json" };

// dovetail.json is the union of the OpenAPI definitions Dovetail publishes on each page of
// https://developers.dovetail.com/reference (no single document is published), merged unchanged
// apart from one shared server and bearer security scheme.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://dovetail.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
