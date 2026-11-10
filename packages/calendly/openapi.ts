import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developer.calendly.com/openapi/calendly-api.yaml" },
  allowedOrigin: "https://api.calendly.com",
  baseUrl: "https://api.calendly.com",
  securitySchemes: {
    oauth2: { type: "http", scheme: "bearer" },
    personal_access_token: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [{ scheme: "personal_access_token", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
