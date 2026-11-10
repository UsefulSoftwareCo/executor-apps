import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://open.manus.ai/docs/v2/openapi_v2.json" },
  allowedOrigin: "https://api.manus.ai",
  securitySchemes: {
    ApiKeyAuth: { type: "apiKey", in: "header", name: "x-manus-api-key" },
    bearer: { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: [{ ApiKeyAuth: [] }, { bearer: [] }] as Record<string, string[]>[],
  methods: {
    apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
