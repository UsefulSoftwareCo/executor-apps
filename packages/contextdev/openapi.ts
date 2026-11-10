import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.context.dev/openapi.json" },
  allowedOrigin: "https://api.context.dev",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
