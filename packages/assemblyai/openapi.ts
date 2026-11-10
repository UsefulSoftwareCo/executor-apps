import type { OpenapiToolNamesOptions } from "apps/openapi";

// AssemblyAI publishes four official OpenAPI documents. index.ts mounts each under its own key.
// The WebSocket streaming API is AsyncAPI only and is not mounted.
const spec = (name: string) => ({ url: `https://www.assemblyai.com/docs/${name}` });

// The key goes raw in the Authorization header (a Bearer prefix is also accepted by the agents API).
const credentials = (scheme: string) =>
  ({
    securitySchemes: { [scheme]: { type: "apiKey", in: "header", name: "Authorization" } },
    methods: { apiKey: [{ scheme, field: "token", part: "value", prefix: "" }] },
    oauth: [],
  }) as const;

export const transcriptionOptions = {
  source: spec("openapi.yaml"),
  allowedOrigin: "https://api.assemblyai.com",
  ...credentials("ApiKey"),
} satisfies OpenapiToolNamesOptions;

export const llmGatewayOptions = {
  source: spec("api-reference/specs/llm-gateway.yaml"),
  allowedOrigin: "https://llm-gateway.assemblyai.com",
  ...credentials("ApiKey"),
} satisfies OpenapiToolNamesOptions;

export const agentsOptions = {
  source: spec("api-reference/specs/agents.yaml"),
  allowedOrigin: "https://agents.assemblyai.com",
  ...credentials("apiKey"),
} satisfies OpenapiToolNamesOptions;

export const webhooksOptions = {
  source: spec("api-reference/specs/webhooks.yaml"),
  allowedOrigin: "https://agents.assemblyai.com",
  ...credentials("apiKey"),
} satisfies OpenapiToolNamesOptions;

export const options = transcriptionOptions;
export const apis = { transcription: transcriptionOptions, llmGateway: llmGatewayOptions, agents: agentsOptions, webhooks: webhooksOptions };
