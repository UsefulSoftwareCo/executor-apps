import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://public-api.process.st/api/v1.1/docs/docs.yaml" },
  allowedOrigin: "https://public-api.process.st",
  securitySchemes: { apiKeyAuth: { type: "apiKey", name: "X-API-Key", in: "header" } },
  methods: { apiKey: [{ scheme: "apiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
