import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://cdn.uptimerobot.com/api/openapi.yaml" },
  allowedOrigin: "https://api.uptimerobot.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
