import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.thecatapi.com/openapi-json" },
  allowedOrigin: "https://api.thecatapi.com",
  baseUrl: "https://api.thecatapi.com/v1",
  securitySchemes: { "x-api-key": { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "x-api-key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
