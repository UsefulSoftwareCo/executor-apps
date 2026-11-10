import type { OpenapiToolNamesOptions } from "apps/openapi";

// Kernel's official document (linked from its docs API pages) declares a bearer scheme named "bearerAuth".
export const options = {
  source: { url: "https://api.onkernel.com/spec.json" },
  baseUrl: "https://api.onkernel.com",
  allowedOrigin: "https://api.onkernel.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: {
    apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
