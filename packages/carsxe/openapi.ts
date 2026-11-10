import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://carsxe.com/openapi.yaml" },
  allowedOrigin: "https://api.carsxe.com",
  securitySchemes: { ApiKeyQuery: { type: "apiKey", in: "query", name: "key" } },
  methods: { apiKey: [{ scheme: "ApiKeyQuery", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
