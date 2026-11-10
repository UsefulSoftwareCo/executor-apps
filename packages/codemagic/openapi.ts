import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://codemagic.io/api/v3/schema/openapi.json" },
  allowedOrigin: "https://codemagic.io",
  securitySchemes: { api_key: { type: "apiKey", in: "header", name: "x-auth-token" } },
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Removed: /user/api-key returns (GET) or revokes (DELETE) the very token this connection uses.
  // /builds/{build_id}/remote-access returns a VNC password into agent context.
  patches: [
    { op: "remove" as const, path: "/paths/~1api~1v3~1user~1api-key" },
    { op: "remove" as const, path: "/paths/~1api~1v3~1builds~1{build_id}~1remote-access" },
  ],
} satisfies OpenapiToolNamesOptions;
