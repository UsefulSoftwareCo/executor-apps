import type { OpenapiToolNamesOptions } from "apps/openapi";

// Browser Use publishes three live specs on the same origin: v4 (current REST API), v3 (superseded by v4,
// kept because its endpoints differ) and v2 (tasks, skills, marketplace, presigned files, lower cost).
// index.ts mounts them under `v4`, `v3` and `v2`.
const credentials = {
  allowedOrigin: "https://api.browser-use.com",
  securitySchemes: { APIKeyHeader: { type: "apiKey", in: "header", name: "X-Browser-Use-API-Key" } },
  methods: { apiKey: [{ scheme: "APIKeyHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

export const options = {
  source: { url: "https://api.browser-use.com/api/v3/openapi.json" },
  ...credentials,
} satisfies OpenapiToolNamesOptions;

export const v2Options = {
  source: { url: "https://api.browser-use.com/api/v2/openapi.json" },
  ...credentials,
} satisfies OpenapiToolNamesOptions;

export const v4Options = {
  source: { url: "https://api.browser-use.com/api/v4/openapi.json" },
  ...credentials,
} satisfies OpenapiToolNamesOptions;
