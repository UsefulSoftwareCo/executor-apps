import type { OpenapiToolNamesOptions } from "apps/openapi";

const credentials = {
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

// v2: https://enrichlayer.com/api/v2 (29 GET operations).
export const options = {
  source: { url: "https://enrichlayer.com/docs/api/v2/openapi.json" },
  allowedOrigin: "https://enrichlayer.com",
  ...credentials,
} satisfies OpenapiToolNamesOptions;

// v3: separate official spec whose server is https://api.enrichlayer.com (2 GET operations).
export const v3Options = {
  source: { url: "https://enrichlayer.com/docs/api/v3/openapi.json" },
  allowedOrigin: "https://api.enrichlayer.com",
  ...credentials,
} satisfies OpenapiToolNamesOptions;
