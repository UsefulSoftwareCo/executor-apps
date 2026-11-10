import type { OpenapiToolNamesOptions } from "apps/openapi";
import { document } from "./spec.ts";

// Converted by generate.py from Grist's official API reference (gristlabs/grist-help). Its server is https://{gristhost}/api;
// index.ts swaps in the account's own site origin.
export const placeholderOrigin = "https://docs.getgrist.com";

export const options = {
  source: { document },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/api`,
  securitySchemes: { ApiKey: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ ApiKey: [] }],
  methods: {
    apiKey: [{ scheme: "ApiKey", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "ApiKey", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
