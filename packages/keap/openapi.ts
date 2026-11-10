import type { OpenapiToolNamesOptions } from "apps/openapi";

// Keap publishes two live OpenAPI 3.1 documents (the ones behind developer.keap.com/docs): REST v2, the default
// version, and REST v1, which still owns REST Hooks, appointments, notes and other resources v2 lacks.
// index.ts mounts each under its own key. Both accept an OAuth bearer token or a service account key.
const credentials = {
  allowedOrigin: "https://api.infusionsoft.com",
  securitySchemes: {
    oauth2: { type: "http", scheme: "bearer" },
    apiKey: { type: "apiKey", in: "header", name: "X-Keap-API-Key" },
  },
  fallbackSecurity: [{ oauth2: [] }],
  methods: {
    oauth: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }],
    apiKey: [{ scheme: "apiKey", field: "apiKey", part: "value", prefix: "" }],
  },
  oauth: [],
} as const;

export const v2Options = {
  source: { url: "https://crm.infusionsoft.com/app/v3/api-docs/V2" },
  ...credentials,
} satisfies OpenapiToolNamesOptions;

export const v1Options = {
  source: { url: "https://crm.infusionsoft.com/app/v3/api-docs/V1" },
  ...credentials,
} satisfies OpenapiToolNamesOptions;

export const options = v2Options;
