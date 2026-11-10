import type { OpenapiToolNamesOptions } from "apps/openapi";
import { document, readOperations } from "./spec.ts";

// Databricks is hosted per workspace (<deployment>.cloud.databricks.com and cloud equivalents).
// The document is hand-written by generate.py; index.ts swaps in the workspace's origin.
export const placeholderOrigin = "https://workspace.cloud.databricks.com";

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
  // These POST operations only read.
  kinds: Object.fromEntries(readOperations.map((id) => [id, "query" as const])),
} satisfies OpenapiToolNamesOptions;
