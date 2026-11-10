import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.whop.com/api/v1/openapi.json" },
  allowedOrigin: "https://api.whop.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: {
    apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearerAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
