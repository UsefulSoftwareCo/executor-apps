import type { OpenapiToolNamesOptions } from "apps/openapi";

// The Hub publishes its own OpenAPI 3.1 document; every operation accepts a bearer
// token (a user access token or an OAuth access token).
export const options = {
  source: { url: "https://huggingface.co/.well-known/openapi.json" },
  allowedOrigin: "https://huggingface.co",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearerAuth: [] }],
  methods: {
    token: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearerAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
