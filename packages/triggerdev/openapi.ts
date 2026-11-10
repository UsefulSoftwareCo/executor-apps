import type { OpenapiToolNamesOptions } from "apps/openapi";

// Trigger.dev's published Management API description; operations take the environment's secret key or (for seven user-scoped operations) a personal access token, both as a bearer token.
export const options = {
  source: { url: "https://trigger.dev/docs/v3-openapi.yaml" },
  allowedOrigin: "https://api.trigger.dev",
  securitySchemes: {
    secretKey: { type: "http", scheme: "bearer" },
    personalAccessToken: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [
      { scheme: "secretKey", field: "token", part: "value", prefix: "" },
      { scheme: "personalAccessToken", field: "token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
