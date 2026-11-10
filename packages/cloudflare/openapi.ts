import type { OpenapiToolNamesOptions } from "apps/openapi";

// Cloudflare's document also lists legacy email + global key and service-key schemes;
// only the scoped API token (bearer) is offered here.
export const options = {
  source: { url: "https://raw.githubusercontent.com/cloudflare/api-schemas/main/openapi.json" },
  allowedOrigin: "https://api.cloudflare.com",
  securitySchemes: { api_token: { type: "http", scheme: "bearer" } },
  methods: {
    apiToken: [{ scheme: "api_token", field: "token", part: "value", prefix: "" }],
    accountToken: [{ scheme: "api_token", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
