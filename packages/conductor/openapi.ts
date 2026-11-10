import type { OpenapiToolNamesOptions } from "apps/openapi";

// The document declares no servers; the API lives at api.conductor.build.
export const options = {
  source: { url: "https://api.conductor.build/v0/openapi.json" },
  allowedOrigin: "https://api.conductor.build",
  baseUrl: "https://api.conductor.build",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
