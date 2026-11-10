import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developer.simplesat.io/api/Simplesat%20API%20(v1)%20OpenAPI.yaml" },
  allowedOrigin: "https://api.simplesat.io",
  securitySchemes: { api_key: { type: "apiKey", in: "header", name: "X-Simplesat-Token" } },
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
