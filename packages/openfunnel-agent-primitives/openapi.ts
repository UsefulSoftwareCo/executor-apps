import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.openfunnel.dev/openapi.json" },
  allowedOrigin: "https://api.openfunnel.dev",
  baseUrl: "https://api.openfunnel.dev",
  securitySchemes: {
    apiKey: { type: "apiKey", name: "X-API-Key", in: "header" },
  },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ apiKey: [] }],
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Public operations keep no security (catalog/status/openfunnel-agent-primitives.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1api~1v1~1agent~1sign-up/post/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1agent~1verify/post/security", value: [] },
    { op: "add", path: "/paths/~1api~1v2~1tech~1country-options/get/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;
