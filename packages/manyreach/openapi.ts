import type { OpenapiToolNamesOptions } from "apps/openapi";

// ManyReach's own Swagger 2.0 document for API v2 (linked from https://api.manyreach.com).
export const options = {
  source: { url: "https://api.manyreach.com/swagger/docs/v2" },
  allowedOrigin: "https://api.manyreach.com",
  securitySchemes: { "X-API-Key": { type: "apiKey", name: "X-API-Key", in: "header" } },
  methods: { apiKey: [{ scheme: "X-API-Key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
