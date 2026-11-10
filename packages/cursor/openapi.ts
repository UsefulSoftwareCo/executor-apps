import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://cursor.com/docs-static/cloud-agents-openapi.yaml" },
  allowedOrigin: "https://api.cursor.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
