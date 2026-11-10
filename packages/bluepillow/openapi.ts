import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://b2a.bluepillow.com/.well-known/openapi.yaml" },
  allowedOrigin: "https://api.b2a.bluepillow.com",
  securitySchemes: { ApiKeyBearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "ApiKeyBearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
