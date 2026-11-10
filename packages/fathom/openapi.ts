import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developers.fathom.ai/api-reference/openapi.yaml" },
  allowedOrigin: "https://api.fathom.ai",
  securitySchemes: {
    ApiKeyAuth: { type: "apiKey", in: "header", name: "X-Api-Key" },
    BearerAuth: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "BearerAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
