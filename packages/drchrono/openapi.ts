import type { OpenapiToolNamesOptions } from "apps/openapi";

// DrChrono's own OpenAPI 3 document, served by the API documentation site.
export const options = {
  source: { url: "https://app.drchrono.com/openapi-schema" },
  allowedOrigin: "https://app.drchrono.com",
  securitySchemes: { drchrono_oauth2: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ drchrono_oauth2: [] }],
  methods: { oauth: [{ scheme: "drchrono_oauth2", field: "access_token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
