import type { OpenapiToolNamesOptions } from "apps/openapi";

// Persona's official OpenAPI repo (persona-id/persona-openapi), pinned to commit 1da483e (API version 2026-09-29).
export const options = {
  source: {
    url: "https://raw.githubusercontent.com/persona-id/persona-openapi/1da483e8ff84766d33210aa060365a55a7f52d13/2026-09-29/openapi-bundled.json",
  },
  allowedOrigin: "https://api.withpersona.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
