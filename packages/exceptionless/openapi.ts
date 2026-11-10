import type { OpenapiToolNamesOptions } from "apps/openapi";

// Exceptionless's document declares security schemes but attaches none to operations;
// every operation accepts a bearer API key.
export const options = {
  source: { url: "https://api.exceptionless.com/docs/v2/openapi.json" },
  allowedOrigin: "https://api.exceptionless.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: { apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
