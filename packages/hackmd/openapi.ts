import type { OpenapiToolNamesOptions } from "apps/openapi";

// The document declares its server as the relative path "/v1"; it is served from api.hackmd.io.
export const options = {
  source: { url: "https://api.hackmd.io/v1/docs/swagger.json" },
  allowedOrigin: "https://api.hackmd.io",
  securitySchemes: { token: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "token", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
