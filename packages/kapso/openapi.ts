import type { OpenapiToolNamesOptions } from "apps/openapi";

const base = {
  allowedOrigin: "https://api.kapso.ai",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

// Kapso publishes four official OpenAPI documents (listed at the end of https://docs.kapso.ai/llms.txt).
// The WhatsApp one also lists a Bearer scheme; the project API key in X-API-Key works for all of them.
export const options = {
  ...base,
  source: { url: "https://docs.kapso.ai/api/meta/whatsapp/openapi-whatsapp.yaml" },
} satisfies OpenapiToolNamesOptions;

export const platformOptions = {
  ...base,
  source: { url: "https://docs.kapso.ai/api/platform/v1/openapi-platform.yaml" },
} satisfies OpenapiToolNamesOptions;

export const workflowsOptions = {
  ...base,
  source: { url: "https://docs.kapso.ai/api/platform/v1/openapi-workflows.yaml" },
} satisfies OpenapiToolNamesOptions;

export const agentOptions = {
  ...base,
  source: { url: "https://docs.kapso.ai/api/platform/v1/openapi-kapso-agent.yaml" },
} satisfies OpenapiToolNamesOptions;
