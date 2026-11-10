import type { OpenapiToolNamesOptions } from "apps/openapi";

// Customer.io's single reference document covers the App API (api.customer.io, bearer App API key)
// and the Track API (track.customer.io, Basic site ID + key). Only the App API origin is mounted.
export const options = {
  source: { url: "https://docs.customer.io/openapi.json" },
  allowedOrigin: "https://api.customer.io",
  securitySchemes: { "Bearer-Auth": { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ "Bearer-Auth": [] }],
  methods: { apiKey: [{ scheme: "Bearer-Auth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
