import type { OpenapiToolNamesOptions } from "apps/openapi";

// Pingdom's description declares no security schemes; every operation takes a bearer API token.
export const options = {
  source: { url: "https://docs.pingdom.com/api/API_3.1.yaml" },
  allowedOrigin: "https://api.pingdom.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: { apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
