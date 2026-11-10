import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://go.ninox.com/api/docs-json" },
  baseUrl: "https://go.ninox.com",
  allowedOrigin: "https://go.ninox.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
