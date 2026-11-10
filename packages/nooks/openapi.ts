import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developer.nooks.in/openapi.yml" },
  allowedOrigin: "https://partner-api.nooks.in",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: {
    apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "BearerAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
