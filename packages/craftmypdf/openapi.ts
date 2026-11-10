import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://craftmypdf.s3.ap-southeast-1.amazonaws.com/craftmypdf_api/craftmypdf_api.yaml" },
  allowedOrigin: "https://api.craftmypdf.com",
  securitySchemes: {
    ApiKeyAuth: { type: "apiKey", name: "X-API-KEY", in: "header" },
  },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
