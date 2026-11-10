import type { OpenapiToolNamesOptions } from "apps/openapi";

// MX Platform API, versioned by date (v20250224). The document lists the integration (int-api.mx.com,
// developer keys) and production (api.mx.com) servers; index.ts binds each account to its own.
export const environments = {
  integration: "https://int-api.mx.com",
  production: "https://api.mx.com",
} as const;

export const options = {
  source: { url: "https://docs.mx.com/openapi/platform-api/v20250224.yaml" },
  allowedOrigin: environments.production,
  baseUrl: environments.production,
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  methods: {
    apiKey: [
      { scheme: "basicAuth", field: "clientId", part: "username", prefix: "" },
      { scheme: "basicAuth", field: "apiKey", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
