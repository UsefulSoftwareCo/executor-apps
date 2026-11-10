import type { OpenapiToolNamesOptions } from "apps/openapi";

// Cookie schemes in the spec are for the console UI; API keys use bearer auth.
export const options = {
  source: { url: "https://neon.com/api_spec/release/v2.json" },
  allowedOrigin: "https://console.neon.tech",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ BearerAuth: [] }],
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
