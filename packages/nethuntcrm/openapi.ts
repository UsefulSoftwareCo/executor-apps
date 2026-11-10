import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://nethunt.com/api/v2/openapi.json" },
  baseUrl: "https://nethunt.com",
  allowedOrigin: "https://nethunt.com",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
