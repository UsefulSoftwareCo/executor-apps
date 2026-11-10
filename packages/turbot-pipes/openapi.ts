import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://pipes.turbot.com/api/latest/docs/openapi.json" },
  allowedOrigin: "https://pipes.turbot.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ ApiKeyAuth: [] }],
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "Bearer " }] },
  oauth: [],
  // Public operations keep no security (catalog/status/turbot-pipes.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1auth~1{provider}/get/security", value: [] },
    { op: "add", path: "/paths/~1auth~1{provider}~1callback/get/security", value: [] },
    { op: "add", path: "/paths/~1login~1confirm/get/security", value: [] },
    { op: "add", path: "/paths/~1login~1token~1{temporary_token_request_id}/get/security", value: [] },
    { op: "add", path: "/paths/~1signup~1confirm/get/security", value: [] },
    { op: "add", path: "/paths/~1auth~1{provider}~1callback/post/security", value: [] },
    { op: "add", path: "/paths/~1login/post/security", value: [] },
    { op: "add", path: "/paths/~1login~1token/post/security", value: [] },
    { op: "add", path: "/paths/~1signup/post/security", value: [] },
    { op: "add", path: "/paths/~1identity/get/security", value: [] },
    { op: "add", path: "/paths/~1identity~1{identity_handle}/get/security", value: [] },
    { op: "add", path: "/paths/~1identity~1{identity_handle}~1avatar/get/security", value: [] },
    { op: "add", path: "/paths/~1tenant~1{tenant_handle}~1avatar/get/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;
