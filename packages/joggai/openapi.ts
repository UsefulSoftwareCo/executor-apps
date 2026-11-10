import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.jogg.ai/api-reference/v2/openapi-v2.yaml" },
  allowedOrigin: "https://api.jogg.ai",
  securitySchemes: { apiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "apiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
