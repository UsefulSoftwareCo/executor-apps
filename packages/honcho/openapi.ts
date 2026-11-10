import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://honcho.dev/docs/v3/openapi.json" },
  allowedOrigin: "https://api.honcho.dev",
  securitySchemes: { HTTPBearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ HTTPBearer: [] }],
  methods: {
    apiKey: [{ scheme: "HTTPBearer", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "HTTPBearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
