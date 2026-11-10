import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://app.bulkpublish.com/openapi.json" },
  allowedOrigin: "https://app.bulkpublish.com",
  securitySchemes: { apiKey: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
