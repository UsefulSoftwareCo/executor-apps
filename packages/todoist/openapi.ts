import type { OpenapiToolNamesOptions } from "apps/openapi";

// Todoist's document declares no security schemes; every operation accepts a bearer token.
export const options = {
  source: { url: "https://developer.todoist.com/openapi.json" },
  allowedOrigin: "https://api.todoist.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    token: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
