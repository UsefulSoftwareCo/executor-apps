import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.gojinko.com/doc" },
  allowedOrigin: "https://api.gojinko.com",
  securitySchemes: {
    ApiKeyAuth: { type: "apiKey", name: "X-API-Key", in: "header" },
  },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
