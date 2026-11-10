import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://carbone.io/file/carbone.OpenAPI.yml" },
  allowedOrigin: "https://api.carbone.io",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
