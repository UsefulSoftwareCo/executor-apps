import type { OpenapiToolNamesOptions } from "apps/openapi";

// Checkvist's official OpenAPI description of its REST API.
export const options = {
  source: { url: "https://checkvist.com/openapi.yaml" },
  allowedOrigin: "https://checkvist.com",
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  methods: {
    // Account email plus the Remote API key from the profile page, sent as HTTP Basic.
    apiKey: [
      { scheme: "basicAuth", field: "email", part: "username", prefix: "" },
      { scheme: "basicAuth", field: "remoteKey", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
