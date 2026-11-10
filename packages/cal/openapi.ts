import type { OpenapiToolNamesOptions } from "apps/openapi";

// Cal.com's document declares no servers or security schemes: every operation takes the
// bearer token as an `Authorization` header parameter, so a bearer scheme is supplied.
export const options = {
  source: { url: "https://cal.com/docs/api-reference/v2/openapi.json" },
  allowedOrigin: "https://api.cal.com",
  baseUrl: "https://api.cal.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
