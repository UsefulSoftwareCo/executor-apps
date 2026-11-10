import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.exa.ai/openapi.json" },
  allowedOrigin: "https://api.exa.ai",
  securitySchemes: {
    apiKey: { type: "apiKey", name: "x-api-key", in: "header" },
    bearer: { type: "http", scheme: "bearer" },
  },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
