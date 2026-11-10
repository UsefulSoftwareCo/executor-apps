import type { OpenapiToolNamesOptions } from "apps/openapi";
import emptySecurity from "./empty-security.json" with { type: "json" };

// JumpCloud publishes two official OpenAPI 3.1 documents on one origin: v1 under /api and v2 under /api/v2.
// index.ts mounts each under its own key and swaps in the account's regional console origin.
const credentials = {
  securitySchemes: { "x-api-key": { type: "apiKey", in: "header", name: "x-api-key" } },
  // A few operations declare no security; send the account's credential on them too.
  fallbackSecurity: [{ "x-api-key": [] }],
  methods: { apiKey: [{ scheme: "x-api-key", field: "apiKey", part: "value", prefix: "" }] },
  oauth: [],
} as const;

export const v1Options = {
  source: { url: "https://docs.jumpcloud.com/api/1.0/index.yaml" },
  allowedOrigin: "https://console.jumpcloud.com",
  baseUrl: "https://console.jumpcloud.com/api",
  ...credentials,
} satisfies OpenapiToolNamesOptions;

// v2 marks seven System Insights operations `security: []`, though they read the organization's devices.
// empty-security.json lists them (scripts/empty-security.ts). The document is not versioned, so a renamed path
// makes its patch fail; regenerate the list then.
export const v2Options = {
  source: { url: "https://docs.jumpcloud.com/api/2.0/index.yaml" },
  allowedOrigin: "https://console.jumpcloud.com",
  baseUrl: "https://console.jumpcloud.com/api/v2",
  ...credentials,
  patches: [
    ...emptySecurity.map((operation) => ({ op: "add" as const, path: `${operation}/security`, value: [{ "x-api-key": [] }] })),
    // Public operations keep no security (catalog/status/jumpcloud.json "credentialFree" says why).
    { op: "add", path: "/paths/~1logos~1{id}/get/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;

// scripts/tools.ts reads `options`; v2 is the larger API.
export const options = v2Options;
