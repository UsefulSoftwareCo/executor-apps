import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.attention.com/api-reference/openapi.json" },
  allowedOrigin: "https://api.attention.tech",
  // The spec declares the key as an apiKey in the Authorization header, but the API
  // expects "Authorization: Bearer <key>" (https://docs.attention.com/api-authentication).
  securitySchemes: { APIKeyHeader: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "APIKeyHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
