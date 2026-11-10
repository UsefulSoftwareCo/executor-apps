import type { OpenapiToolNamesOptions } from "apps/openapi";

// Momentum's official OpenAPI document. The user-provided-meeting ingest operation lives on
// receiver.momentum.io, a second origin, so it is skipped.
export const options = {
  source: { url: "https://docs.momentum.io/api/openapi-spec.yaml" },
  allowedOrigin: "https://api.momentum.io",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
