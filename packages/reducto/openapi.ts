import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://platform.reducto.ai/openapi.json" },
  allowedOrigin: "https://platform.reducto.ai",
  securitySchemes: { SkippableHTTPBearer: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ SkippableHTTPBearer: [] }],
  methods: { apiKey: [{ scheme: "SkippableHTTPBearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
