import type { OpenapiToolNamesOptions } from "apps/openapi";

// One VectorShift product, four official specs published with the API reference at docs.vectorshift.ai.
// index.ts mounts each under its own key.
const api = (path: string) =>
  ({
    source: { url: `https://docs.vectorshift.ai/api-reference/${path}` },
    allowedOrigin: "https://api.vectorshift.ai",
    securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
    methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const pipelinesOptions = api("pipelines/pipeline.json");
export const knowledgeBasesOptions = api("knowledge-bases/knowledge_base.json");
export const chatbotsOptions = api("chatbots/chatbot.json");
export const transformationsOptions = api("transformations/transformation.json");

export const options = pipelinesOptions;
