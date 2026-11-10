import type { OpenapiToolNamesOptions } from "apps/openapi";

// Timetastic's official OpenAPI 3.0 document. It declares no servers (paths start with /api), so the base URL is pinned.
export const options = {
  source: { url: "https://app.timetastic.co.uk/swagger/v1/swagger.json" },
  allowedOrigin: "https://app.timetastic.co.uk",
  baseUrl: "https://app.timetastic.co.uk",
  securitySchemes: { Bearer: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ Bearer: [] }],
  methods: { apiKey: [{ scheme: "Bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
