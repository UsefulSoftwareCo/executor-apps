import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// Weflow serves its OpenAPI document only inside the Swagger UI bundle at
// https://api.getweflow.app/api/v1/docs/ (swagger-ui-init.js, `swaggerDoc`), with a relative
// server URL, so document.json is that definition and baseUrl pins the API root.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.getweflow.app",
  baseUrl: "https://api.getweflow.app/api/v1",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
