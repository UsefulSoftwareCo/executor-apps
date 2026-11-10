import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://www.financialdatasets.ai/openapi.json" },
  allowedOrigin: "https://api.financialdatasets.ai",
  securitySchemes: { "X-API-KEY": { type: "apiKey", name: "X-API-KEY", in: "header" } },
  methods: { apiKey: [{ scheme: "X-API-KEY", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
