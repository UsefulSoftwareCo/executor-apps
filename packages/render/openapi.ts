import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api-docs.render.com/openapi/render-public-api-1.json" },
  allowedOrigin: "https://api.render.com",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
