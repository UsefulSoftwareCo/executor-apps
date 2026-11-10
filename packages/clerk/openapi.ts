import type { OpenapiToolNamesOptions } from "apps/openapi";

// Clerk's versioned Backend API spec; bump the dated file to adopt a newer API version.
export const options = {
  source: { url: "https://raw.githubusercontent.com/clerk/openapi-specs/main/bapi/2026-05-12.yml" },
  allowedOrigin: "https://api.clerk.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
