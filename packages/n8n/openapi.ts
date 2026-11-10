import type { OpenapiToolNamesOptions } from "apps/openapi";
import specDocument from "./spec.json" with { type: "json" };

// spec.json is a vendored snapshot of n8n's bundled public API OpenAPI document (version in info.version), converted from YAML to
// JSON unchanged. The source in github.com/n8n-io/n8n (packages/cli/src/public-api/v1/openapi.yml) is split across files with
// relative $refs, and n8n publishes no stable URL for the bundled file, so it is vendored. Its servers are relative to the
// instance, so index.ts pins each account's own instance URL (including /api/v1).
export const placeholderOrigin = "https://example.com";

export const options = {
  source: { document: specDocument as never },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/api/v1`,
  securitySchemes: {
    ApiKeyAuth: { type: "apiKey", in: "header", name: "X-N8N-API-KEY" },
  },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "apiKey", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
