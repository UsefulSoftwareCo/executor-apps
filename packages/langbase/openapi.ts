import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.langbase.com/openapi.json" },
  allowedOrigin: "https://api.langbase.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ bearerAuth: [] }],
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Public operations keep no security (catalog/status/langbase.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1health/get/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;
