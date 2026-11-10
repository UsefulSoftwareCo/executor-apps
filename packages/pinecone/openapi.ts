import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Pinecone product, five official specs from https://github.com/pinecone-io/pinecone-api (API version
// 2026-07, pinned to a commit). index.ts mounts each under its own key. The data-plane specs have no fixed origin (each index and
// assistant has its own host), so the placeholder origins below are only used to compile; index.ts swaps in
// the host stored on the account.
const spec = (name: string) => ({
  url: `https://raw.githubusercontent.com/pinecone-io/pinecone-api/6d2d0834766f956e84f6c065a8ccd03ca39dc861/2026-07/${name}_2026-07.oas.yaml`,
});

const credentials = {
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "Api-Key" } },
  methods: {
    apiKey: [{ scheme: "ApiKeyAuth", field: "apiKey", part: "value", prefix: "" }],
    index: [{ scheme: "ApiKeyAuth", field: "apiKey", part: "value", prefix: "" }],
    assistant: [{ scheme: "ApiKeyAuth", field: "apiKey", part: "value", prefix: "" }],
  },
  oauth: [],
} as const;

// Every Pinecone operation declares X-Pinecone-Api-Version as a required header. index.ts binds this value
// through parameterDefaults, which makes the header optional in the tool input.
export const apiVersion = "2026-07";

const api = <const K extends Record<string, "query">>(name: string, baseUrl: string, kinds: K) =>
  ({ source: spec(name), allowedOrigin: new URL(baseUrl).origin, baseUrl, ...credentials, kinds }) satisfies OpenapiToolNamesOptions;

export const controlOptions = api("db_control", "https://api.pinecone.io", {});
export const inferenceOptions = api("inference", "https://api.pinecone.io", {
  embed: "query",
  rerank: "query",
});
export const assistantControlOptions = api("assistant_control", "https://api.pinecone.io/assistant", {});
// POST operations that only read are kinds=query, so they run without an approval prompt. The assistant chat
// operations (chat_assistant, chat_completion_assistant) stream text/event-stream; the framework does not
// compile streaming operations, so they are not exposed and need no entry here.
export const dataOptions = api("db_data", "https://index_host.svc.pinecone.io", {
  queryVectors: "query",
  describeIndexStats: "query",
  fetchVectorsByMetadata: "query",
  searchRecordsNamespace: "query",
  searchDocuments: "query",
  fetchDocuments: "query",
  listDocuments: "query",
});
export const assistantDataOptions = api("assistant_data", "https://assistant_host.pinecone.io", {
  context_assistant: "query",
});

// scripts/tools.ts reads `options`; the control plane is the main one.
export const options = controlOptions;
