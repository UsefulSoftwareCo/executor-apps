import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.latticehq.com/v1/swagger" },
  allowedOrigin: "https://api.latticehq.com",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
