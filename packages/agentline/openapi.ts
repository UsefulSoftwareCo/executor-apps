import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.agentline.cloud/openapi.json" },
  allowedOrigin: "https://api.agentline.cloud",
  securitySchemes: { "API Key or OAuth": { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ "API Key or OAuth": [] }],
  methods: { apiKey: [{ scheme: "API Key or OAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Public operations keep no security (catalog/status/agentline.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1health/get/security", value: [] },
    { op: "add", path: "/paths/~1v1~1auth~1agentid~1callback/get/security", value: [] },
    { op: "add", path: "/paths/~1.well-known~1agentline.json/get/security", value: [] },
    { op: "add", path: "/paths/~1.well-known~1agent-payments.json/get/security", value: [] },
    { op: "add", path: "/paths/~1.well-known~1x402/get/security", value: [] },
    { op: "add", path: "/paths/~1.well-known~1x402.json/get/security", value: [] },
    { op: "add", path: "/paths/~1v1~1auth~1agentid~1poll/post/security", value: [] },
    { op: "add", path: "/paths/~1v1~1auth~1agentid~1start/post/security", value: [] },
    { op: "add", path: "/paths/~1v1~1auth~1otp/post/security", value: [] },
    { op: "add", path: "/paths/~1v1~1auth~1verify/post/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;
