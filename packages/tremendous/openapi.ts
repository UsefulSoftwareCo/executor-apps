import type { OpenapiToolNamesOptions } from "apps/openapi";

// The spec lists the sandbox server first; the production origin is the one credentials go to.
export const options = {
  source: { url: "https://cdn.tremendous.com/openapi/spec.yml" },
  baseUrl: "https://api.tremendous.com/api/v2",
  allowedOrigin: "https://api.tremendous.com",
  securitySchemes: { BearerApiKey: { type: "http", scheme: "bearer" } },
  methods: {
    apiKey: [{ scheme: "BearerApiKey", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "BearerApiKey", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
