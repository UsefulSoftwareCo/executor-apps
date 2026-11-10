import type { OpenapiToolNamesOptions } from "apps/openapi";

// Insighto.ai's published document (api.insighto.ai/docs) declares no `servers`; the API lives on the
// same origin. The key is sent as the `api_key` query parameter.
export const options = {
  source: { url: "https://api.insighto.ai/api/v1/openapi.json" },
  baseUrl: "https://api.insighto.ai",
  allowedOrigin: "https://api.insighto.ai",
  securitySchemes: { "Your API Key": { type: "apiKey", in: "query", name: "api_key" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ "Your API Key": [] }],
  methods: { apiKey: [{ scheme: "Your API Key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Public operations keep no security (catalog/status/insightoai.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1api~1v1~1voice~1syncing_providers/get/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1agency~1{agency_id}~1branding/get/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1agency~1billing~1{agency_id}~1get_stripe_billing_plans/get/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;
