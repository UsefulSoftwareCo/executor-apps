import type { OpenapiToolNamesOptions } from "apps/openapi";

// HeyGen's published OpenAPI document spans api.heygen.com and upload.heygen.com; only the main
// origin is callable here, so the upload-host operations are skipped.
export const options = {
  source: { url: "https://developers.heygen.com/openapi.yaml" },
  allowedOrigin: "https://api.heygen.com",
  securitySchemes: {
    ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-KEY" },
  },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
