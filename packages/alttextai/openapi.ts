import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://alttext.ai/openapi.yml" },
  baseUrl: "https://alttext.ai/api/v1",
  allowedOrigin: "https://alttext.ai",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", name: "X-API-Key", in: "header" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
