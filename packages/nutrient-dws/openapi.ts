import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://www.nutrient.io/api/reference/public/openapi.yml" },
  allowedOrigin: "https://api.nutrient.io",
  securitySchemes: { BearerToken: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerToken", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
