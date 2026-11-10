import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://wistia.github.io/wistia/api/openapi-modern.yaml" },
  allowedOrigin: "https://api.wistia.com",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: {
    apiToken: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "BearerAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
