import type { OpenapiToolNamesOptions } from "apps/openapi";

// The official Basecamp SDK's OpenAPI description, pinned to commit 490e10dcea4a933689ccaafa9214c03365fff969 (tag v0.24.0, info.version 2026-09-15). It declares no servers or security
// schemes, and every path starts with the account ID, which each tool takes as `accountId`.
export const options = {
  source: { url: "https://raw.githubusercontent.com/basecamp/basecamp-sdk/490e10dcea4a933689ccaafa9214c03365fff969/openapi.json" },
  allowedOrigin: "https://3.basecampapi.com",
  baseUrl: "https://3.basecampapi.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: { oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
