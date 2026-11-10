import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developer.pdf.co/openapi.json" },
  allowedOrigin: "https://api.pdf.co",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
