import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://www.agentmail.to/openapi.json" },
  allowedOrigin: "https://api.agentmail.to",
  securitySchemes: { Bearer: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ Bearer: [] }],
  methods: { apiKey: [{ scheme: "Bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Public operations keep no security (catalog/status/agentmail.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1v0~1agent~1sign-up/post/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;
