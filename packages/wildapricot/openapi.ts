import type { OpenapiToolNamesOptions } from "apps/openapi";
import { document } from "./spec.ts";

// OpenAPI 3.0 conversion of WildApricot's official Admin API Swagger 2.0 definition (generate.mjs).
export const options = {
  source: { document },
  allowedOrigin: "https://api.wildapricot.org",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    apiKey: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
