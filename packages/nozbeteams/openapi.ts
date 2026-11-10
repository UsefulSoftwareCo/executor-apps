import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api4.nozbe.com/v1/api/openapi.yaml" },
  allowedOrigin: "https://api4.nozbe.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "apikey " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
