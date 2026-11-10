import type { OpenapiToolNamesOptions } from "apps/openapi";

// The spec marks nearly every operation with its "xata" OAuth scheme, but the API
// accepts an organization API key as a bearer token on all of them.
export const options = {
  source: { url: "https://api.xata.tech/openapi.json" },
  allowedOrigin: "https://api.xata.tech",
  securitySchemes: {
    xata: { type: "http", scheme: "bearer" },
    apiKey: { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: [{ apiKey: [] }],
  methods: {
    apiKey: [
      { scheme: "xata", field: "token", part: "value", prefix: "" },
      { scheme: "apiKey", field: "token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
