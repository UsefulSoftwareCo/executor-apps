import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://productlane.com/api/v2/openapi" },
  allowedOrigin: "https://productlane.com",
  securitySchemes: { Authorization: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "Authorization", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
