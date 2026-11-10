import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://typecast.ai/docs/api-reference/openapi.json" },
  allowedOrigin: "https://api.typecast.ai",
  securitySchemes: {
    ApiKeyAuth: { type: "apiKey", name: "X-API-KEY", in: "header" },
  },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
