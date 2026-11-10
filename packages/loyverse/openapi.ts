import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developer.loyverse.com/docs/API-Reference__v1.0.yaml" },
  allowedOrigin: "https://api.loyverse.com",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ BearerAuth: [] }],
  methods: {
    accessToken: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "BearerAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
