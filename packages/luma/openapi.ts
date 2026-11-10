import type { OpenapiToolNamesOptions } from "apps/openapi";

// Official OpenAPI 3.1 document published by Luma (linked from https://docs.luma.com/reference/getting-started-with-your-api).
export const options = {
  source: { url: "https://public-api.luma.com/openapi.json" },
  allowedOrigin: "https://public-api.luma.com",
  securitySchemes: { apiKeyAuth: { type: "apiKey", in: "header", name: "x-luma-api-key" } },
  methods: { apiKey: [{ scheme: "apiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
