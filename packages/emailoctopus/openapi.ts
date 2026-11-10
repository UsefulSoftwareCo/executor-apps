import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://emailoctopus.com/api-documentation/v2" },
  allowedOrigin: "https://api.emailoctopus.com",
  securitySchemes: { api_key: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
