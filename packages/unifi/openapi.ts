import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developer.ui.com/site-manager/v1.0.0/openapi.json" },
  allowedOrigin: "https://api.ui.com",
  securitySchemes: { "site-manager-api-key": { type: "apiKey", in: "header", name: "X-API-Key" } },
  methods: { apiKey: [{ scheme: "site-manager-api-key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // The connector paths end in a literal "*path" segment, not a "{path}" template, so the
  // framework would send the literal text and never forward the caller's path. Drop them.
  patches: [{ op: "remove", path: "/paths/~1v1~1connector~1consoles~1{id}~1*path" }],
} satisfies OpenapiToolNamesOptions;
