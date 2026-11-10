import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developers.abyssale.com/api.yaml" },
  allowedOrigin: "https://api.abyssale.com",
  securitySchemes: {
    api_key: { type: "apiKey", name: "x-api-key", in: "header" },
  },
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
