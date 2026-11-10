import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://www.wappalyzer.com/openapi/v2-public.yaml" },
  allowedOrigin: "https://api.wappalyzer.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
