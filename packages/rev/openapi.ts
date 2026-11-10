import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Rev AI product, six official specs published at docs.rev.ai. Each is mounted under its own key in index.ts.
const api = (name: string, pathPrefix?: string) =>
  ({
    source: { url: `https://docs.rev.ai/_bundle/api/${name}/reference.json?download` },
    allowedOrigin: "https://api.rev.ai",
    ...(pathPrefix ? { pathPrefix } : {}),
    securitySchemes: { AccessToken: { type: "http", scheme: "bearer" } },
    methods: { apiKey: [{ scheme: "AccessToken", field: "token", part: "value", prefix: "" }] },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const asynchronousOptions = api("asynchronous");
export const customVocabularyOptions = api("custom-vocabulary", "/speechtotext/v1");
export const topicExtractionOptions = api("topic-extraction");
export const sentimentAnalysisOptions = api("sentiment-analysis");
export const languageIdentificationOptions = api("language-identification");
export const alignmentOptions = api("alignment");

// The custom-vocabulary spec declares server https://api.rev.ai but its paths live under /speechtotext/v1 (the other four
// companion specs already carry their product prefix in each path).
// scripts/tools.ts reads `options`; the transcription API is the main one.
export const options = asynchronousOptions;
