import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://raw.githubusercontent.com/proxied-mail/api-docs/master/openapi.yaml" },
  allowedOrigin: "https://proxiedmail.com",
  securitySchemes: {
    api_key: { type: "apiKey", in: "header", name: "Token" },
    api_auth: { type: "http", scheme: "bearer" },
  },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ api_key: [] }],
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Public operations keep no security (catalog/status/proxiedmail.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1api~1v1~1auth/post/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1users/post/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1ask-form/post/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;
