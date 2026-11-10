import type { OpenapiToolNamesOptions } from "apps/openapi";
import { document } from "./spec.ts";

// ONLYOFFICE's official DocSpace API document, vendored by generate.py. Every portal serves the same
// API under /api/2.0; index.ts points calls at the account's own portal.
export const placeholderOrigin = "https://docspace.example.com";

export const options = {
  source: { document },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  // API keys are sent as `Authorization: Bearer <key>`.
  securitySchemes: { ApiKeyBearer: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: {
    apiKey: [{ scheme: "ApiKeyBearer", field: "token", part: "value", prefix: "Bearer " }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
