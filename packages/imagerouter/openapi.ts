import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.imagerouter.io/.well-known/openapi.yaml" },
  allowedOrigin: "https://api.imagerouter.io",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation but POST /v1/api-keys.
  fallbackSecurity: [{ bearerAuth: [] }],
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // It takes only a management key, which the account's API key is not (catalog/status/imagerouter.json "credentialFree").
  patches: [{ op: "add", path: "/paths/~1v1~1api-keys/post/security", value: [] }],
} satisfies OpenapiToolNamesOptions;
