import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.poma-ai.com/v3/openapi.yaml" },
  allowedOrigin: "https://api.poma-ai.com",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Retrieval endpoints use POST but only read, so they run without approval.
  kinds: { grillSearch: "query", grillSearchInDoc: "query" },
} satisfies OpenapiToolNamesOptions;
