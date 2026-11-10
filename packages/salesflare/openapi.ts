import type { OpenapiToolNamesOptions } from "apps/openapi";

// Salesflare's Swagger document declares no security schemes; every operation takes a bearer API key.
export const options = {
  source: { url: "https://api.salesflare.com/openapi.json" },
  allowedOrigin: "https://api.salesflare.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: { apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
