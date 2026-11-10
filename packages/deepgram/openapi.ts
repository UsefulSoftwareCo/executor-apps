import type { OpenapiToolNamesOptions } from "apps/openapi";

// Deepgram's description lists two servers: agent.deepgram.com and api.deepgram.com. Per Deepgram's
// reference pages only GET /v1/agent/settings/think/models lives on agent.deepgram.com (api.deepgram.com
// answers 404 for it); every other operation, including the agent configuration and variable
// endpoints, is documented on api.deepgram.com. A router pins one origin, so the think-models
// operation is mounted by a second router on agent.deepgram.com and removed from the first.
const common = {
  source: { url: "https://developers.deepgram.com/openapi.yml" },
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  fallbackSecurity: [{ ApiKeyAuth: [] }],
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "Token " }] },
  oauth: [],
} as const;

export const options = {
  ...common,
  allowedOrigin: "https://api.deepgram.com",
  baseUrl: "https://api.deepgram.com",
  patches: [{ op: "remove", path: "/paths/~1v1~1agent~1settings~1think~1models" }],
} satisfies OpenapiToolNamesOptions;

// Every path except the think-models one, removed so this router exposes that operation alone.
const otherPaths = [
  "/paths/~1v1~1projects~1{project_id}~1agents",
  "/paths/~1v1~1projects~1{project_id}~1agents~1{agent_id}",
  "/paths/~1v1~1projects~1{project_id}~1agent-variables",
  "/paths/~1v1~1projects~1{project_id}~1agent-variables~1{variable_id}",
  "/paths/~1v1~1listen",
  "/paths/~1v1~1speak",
  "/paths/~1v1~1read",
  "/paths/~1v1~1projects",
  "/paths/~1v1~1projects~1{project_id}",
  "/paths/~1v1~1projects~1{project_id}~1leave",
  "/paths/~1v1~1projects~1{project_id}~1models",
  "/paths/~1v1~1projects~1{project_id}~1models~1{model_id}",
  "/paths/~1v1~1models",
  "/paths/~1v1~1models~1{model_id}",
  "/paths/~1v1~1projects~1{project_id}~1keys",
  "/paths/~1v1~1projects~1{project_id}~1keys~1{key_id}",
  "/paths/~1v1~1projects~1{project_id}~1members",
  "/paths/~1v1~1projects~1{project_id}~1members~1{member_id}",
  "/paths/~1v1~1projects~1{project_id}~1members~1{member_id}~1scopes",
  "/paths/~1v1~1projects~1{project_id}~1invites",
  "/paths/~1v1~1projects~1{project_id}~1invites~1{email}",
  "/paths/~1v1~1projects~1{project_id}~1requests",
  "/paths/~1v1~1projects~1{project_id}~1requests~1{request_id}",
  "/paths/~1v1~1projects~1{project_id}~1usage",
  "/paths/~1v1~1projects~1{project_id}~1usage~1fields",
  "/paths/~1v1~1projects~1{project_id}~1usage~1breakdown",
  "/paths/~1v1~1projects~1{project_id}~1balances",
  "/paths/~1v1~1projects~1{project_id}~1balances~1{balance_id}",
  "/paths/~1v1~1projects~1{project_id}~1billing~1breakdown",
  "/paths/~1v1~1projects~1{project_id}~1billing~1fields",
  "/paths/~1v1~1projects~1{project_id}~1purchases",
  "/paths/~1v1~1projects~1{project_id}~1self-hosted~1distribution~1credentials",
  "/paths/~1v1~1projects~1{project_id}~1self-hosted~1distribution~1credentials~1{distribution_credentials_id}",
  "/paths/~1v1~1auth~1grant",
  "/paths/~1v2~1speak",
] as const;

export const agentOptions = {
  ...common,
  allowedOrigin: "https://agent.deepgram.com",
  baseUrl: "https://agent.deepgram.com",
  patches: otherPaths.map((path) => ({ op: "remove" as const, path })),
} satisfies OpenapiToolNamesOptions;
