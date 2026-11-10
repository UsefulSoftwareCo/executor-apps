import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://demodesk.com/api/docs/v2/generated.yaml" },
  allowedOrigin: "https://demodesk.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
