import type { OpenapiToolNamesOptions } from "apps/openapi";
import { document } from "./spec.ts";

// Snowflake is hosted per account (<org>-<account>.snowflakecomputing.com). The spec is bundled
// from Snowflake's official per-resource files by generate.py; index.ts swaps in the account's origin.
export const placeholderOrigin = "https://org-account.snowflakecomputing.com";

export const options = {
  source: { document },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    token: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
