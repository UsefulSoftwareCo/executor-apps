import type { OpenapiToolNamesOptions } from "apps/openapi";

// Recruit CRM's own OpenAPI 3.0 document, served by the API itself. It declares no servers and an empty
// global security requirement, so the origin and the bearer scheme are pinned here.
export const options = {
  source: { url: "https://api.recruitcrm.io/docs" },
  allowedOrigin: "https://api.recruitcrm.io",
  baseUrl: "https://api.recruitcrm.io",
  securitySchemes: { global: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ global: [] }],
  methods: { apiKey: [{ scheme: "global", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
