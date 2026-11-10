import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// openapi.json is generated from Google's official Gemini API (generativelanguage v1beta) Discovery document
// (https://generativelanguage.googleapis.com/$discovery/rest?version=v1beta, revision 20261010) by convert-discovery.mjs.
// The document declares no security; every operation takes either an API key (`x-goog-api-key` header) or an OAuth bearer token.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://generativelanguage.googleapis.com",
  securitySchemes: {
    apiKey: { type: "apiKey", in: "header", name: "x-goog-api-key" },
    bearer: { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: [{ apiKey: [] as string[] }, { bearer: [] as string[] }] as { [x: string]: string[] }[],
  methods: {
    apiKey: [{ scheme: "apiKey", field: "apiKey", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  // These POST operations only compute a response (generation, embeddings, token counts) and change no stored state.
  kinds: {
    "generativelanguage.models.generateContent": "query",
    "generativelanguage.models.countTokens": "query",
    "generativelanguage.models.embedContent": "query",
    "generativelanguage.models.batchEmbedContents": "query",
    "generativelanguage.models.generateAnswer": "query",
    "generativelanguage.models.generateMessage": "query",
    "generativelanguage.models.generateText": "query",
    "generativelanguage.models.embedText": "query",
    "generativelanguage.models.batchEmbedText": "query",
    "generativelanguage.models.countMessageTokens": "query",
    "generativelanguage.models.countTextTokens": "query",
    "generativelanguage.tunedModels.generateContent": "query",
    "generativelanguage.tunedModels.countTokens": "query",
    "generativelanguage.tunedModels.embedContent": "query",
    "generativelanguage.tunedModels.batchEmbedContents": "query",
    "generativelanguage.tunedModels.generateAnswer": "query",
    "generativelanguage.tunedModels.generateMessage": "query",
    "generativelanguage.tunedModels.generateText": "query",
    "generativelanguage.tunedModels.embedText": "query",
    "generativelanguage.tunedModels.batchEmbedText": "query",
    "generativelanguage.tunedModels.countMessageTokens": "query",
    "generativelanguage.tunedModels.countTextTokens": "query",
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
