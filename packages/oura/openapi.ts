import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://cloud.ouraring.com/v2/static/json/openapi-1.41.json" },
  allowedOrigin: "https://api.ouraring.com",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ BearerAuth: [] }],
  methods: {
    oauth: [{ scheme: "BearerAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
