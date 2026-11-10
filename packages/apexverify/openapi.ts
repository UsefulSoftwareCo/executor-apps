import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.apexverify.com/openapi.json" },
  allowedOrigin: "https://api.apexverify.com",
  securitySchemes: { APIKeyHeader: { type: "apiKey", in: "header", name: "X-API-Key" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ APIKeyHeader: [] }],
  methods: { apiKey: [{ scheme: "APIKeyHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
