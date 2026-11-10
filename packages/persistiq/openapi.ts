import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.persistiq.com/api-docs/v1/swagger.json" },
  allowedOrigin: "https://api.persistiq.com",
  securitySchemes: {
    api_key: { type: "apiKey", name: "x-api-key", in: "header" },
  },
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
