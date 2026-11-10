import type { OpenapiToolNamesOptions } from "apps/openapi";

// Paperform's official OpenAPI document, published through its ReadMe developer hub.
export const options = {
  source: { url: "https://dash.readme.com/api/v1/api-registry/pju693bmv4i6h2u" },
  allowedOrigin: "https://api.paperform.co",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
