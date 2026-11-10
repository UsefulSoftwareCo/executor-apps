import type { OpenapiToolNamesOptions } from "apps/openapi";
import specDocument from "./spec.json" with { type: "json" };

// Recall.ai publishes no single spec file. Every endpoint page on docs.recall.ai/reference/<operationId>.md
// embeds that operation's official OpenAPI definition; spec.json is those 111 definitions merged
// unchanged (paths and components) into one document. The API is hosted per region; index.ts swaps
// in the account's origin.
export const placeholderOrigin = "https://us-east-1.recall.ai";

export const options = {
  source: { document: specDocument as never },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { tokenAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "tokenAuth", field: "token", part: "value", prefix: "Token " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
