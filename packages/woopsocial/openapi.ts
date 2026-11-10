import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.woopsocial.com/v1/openapi.yaml" },
  allowedOrigin: "https://api.woopsocial.com",
  securitySchemes: { ApiKey: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "ApiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
