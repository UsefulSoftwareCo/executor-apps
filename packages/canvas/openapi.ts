import type { OpenapiToolNamesOptions } from "apps/openapi";
import { document } from "./spec.ts";

// Canvas is hosted per institution (<school>.instructure.com). The spec is converted from
// Instructure's official Swagger 1.2 docs by generate.mjs; index.ts swaps in the account's origin.
export const placeholderOrigin = "https://canvas.instructure.com";

export const options = {
  source: { document },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/api`,
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    token: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
