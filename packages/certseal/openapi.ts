import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://app.certseal.com/docs/openapi.yaml" },
  allowedOrigin: "https://services.certseal.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
