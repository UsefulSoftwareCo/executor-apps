import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://leadmagic.io/openapi.json" },
  allowedOrigin: "https://api.leadmagic.io",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
