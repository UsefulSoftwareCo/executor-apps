import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://felt.com/api/v2/openapi.json" },
  allowedOrigin: "https://felt.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
