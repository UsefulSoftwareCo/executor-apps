import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.codacy.com/api/api-docs/swagger.yaml" },
  allowedOrigin: "https://api.codacy.com",
  securitySchemes: {
    ApiKeyAuth: { type: "apiKey", in: "header", name: "api-token" },
  },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
