import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developer.klara.ch/klara-openapi.json" },
  allowedOrigin: "https://api.klara.ch",
  securitySchemes: { apiKeyAuth: { type: "apiKey", name: "X-API-KEY", in: "header" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ apiKeyAuth: [] }],
  methods: { apiKey: [{ scheme: "apiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Public operations keep no security (catalog/status/klara.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1core~1latest~1token/post/security", value: [] },
    { op: "add", path: "/paths/~1core~1latest~1token~1by-microsoft/post/security", value: [] },
    { op: "add", path: "/paths/~1core~1latest~1generic-token/post/security", value: [] },
    { op: "add", path: "/paths/~1core~1latest~1tenants/post/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;
