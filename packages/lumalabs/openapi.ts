import type { OpenapiToolNamesOptions } from "apps/openapi";

// Luma's own OpenAPI description for the Agents API, the document its official SDKs are generated from.
export const options = {
  source: {
    url: "https://storage.googleapis.com/stainless-sdk-openapi-specs/luma-ai-karanganesan/luma-agents-8c5b06cd9d673015a5a9c1790d7fee4ce93fd10b2d9e3ee27cf29fbc03d1f829.yml",
  },
  allowedOrigin: "https://agents.lumalabs.ai",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
