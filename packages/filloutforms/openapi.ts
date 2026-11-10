import type { OpenapiToolNamesOptions } from "apps/openapi";

// Fillout's official OpenAPI document lists a US and an EU server; this package targets the US one.
export const options = {
  source: { url: "https://www.fillout.com/help/openapi.json" },
  allowedOrigin: "https://api.fillout.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearerAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
