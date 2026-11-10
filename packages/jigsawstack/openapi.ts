import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://jigsawstack.com/openapi.json" },
  allowedOrigin: "https://api.jigsawstack.com",
  securitySchemes: {
    apiKey: { type: "apiKey", in: "header", name: "x-api-key" },
  },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
