import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.echtpost.de/v2/openapi.json" },
  allowedOrigin: "https://api.echtpost.de",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
