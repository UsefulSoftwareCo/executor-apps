import type { OpenapiToolNamesOptions } from "apps/openapi";

// Lakera publishes two official OpenAPI documents: the Guard API (screening) and the Platform API
// (policies, projects, logs, analytics). Both use a bearer API key. index.ts mounts each under its own key.
const credentials = {
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

// Screening, result lookup and policy checks only read or evaluate, so they are queries and run without approval.
export const guardOptions = {
  source: { url: "https://docs.lakera.ai/openapi/guard-api.json" },
  allowedOrigin: "https://api.lakera.ai",
  baseUrl: "https://api.lakera.ai",
  ...credentials,
  kinds: {
    guard_screenContent: "query",
    guardResults_getResults: "query",
    policiesHealth_checkPolicyHealth: "query",
    policiesLinter_lintPolicy: "query",
  },
} satisfies OpenapiToolNamesOptions;

// The four /v1-beta/policies operations are deprecated: the spec says they were retired with the
// launch of Policies V2 and always return 410 Gone, so they are removed (use /v1/policies).
const platformPatches = [
  { op: "remove", path: "/paths/~1v1-beta~1policies" },
  { op: "remove", path: "/paths/~1v1-beta~1policies~1{policyId}" },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const platformOptions = {
  source: { url: "https://docs.lakera.ai/openapi/platform-api.json" },
  allowedOrigin: "https://platform.lakera.ai",
  baseUrl: "https://platform.lakera.ai/api",
  patches: platformPatches,
  ...credentials,
  kinds: {
    logs_getLogs: "query",
    analytics_getAnalytics: "query",
  },
} satisfies OpenapiToolNamesOptions;

export const options = guardOptions;
