import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.hail.so/openapi.json" },
  allowedOrigin: "https://api.hail.so",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ bearerAuth: [] }],
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Public operations keep no security (catalog/status/hail.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1healthz/get/security", value: [] },
    { op: "add", path: "/paths/~1v1~1unsubscribe/get/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;
