import type { OpenapiToolNamesOptions } from "apps/openapi";
import { document } from "./spec.ts";

// Blackboard Learn is hosted per institution. The spec is converted from Anthology's official
// Swagger 2.0 document by generate.mjs; index.ts swaps in the account's origin and replaces the
// placeholder bearer credential with a token it exchanges from the application key and secret.
export const placeholderOrigin = "https://blackboard.example.com";

export const options = {
  source: { document },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    application: [{ scheme: "bearer", field: "secret", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
