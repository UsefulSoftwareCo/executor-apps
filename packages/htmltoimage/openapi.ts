import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://html2img.com/openapi.json" },
  allowedOrigin: "https://app.html2img.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
