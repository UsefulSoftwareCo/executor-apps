import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.tailscale.com/api/v2?outputOpenapiSchema=true" },
  allowedOrigin: "https://api.tailscale.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: {
    apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearerAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
