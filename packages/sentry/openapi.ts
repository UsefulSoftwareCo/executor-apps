import type { OpenapiToolNamesOptions } from "apps/openapi";

// Sentry's API description lists https://{region}.sentry.io with region us or de. index.ts pins the
// account's own region as the only origin that receives credentials.
export const regions = {
  us: "https://us.sentry.io",
  de: "https://de.sentry.io",
} as const;

export const options = {
  source: {
    url: "https://raw.githubusercontent.com/getsentry/sentry-api-schema/main/openapi-derefed.json",
  },
  allowedOrigin: regions.us,
  baseUrl: regions.us,
  securitySchemes: { auth_token: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ auth_token: [] }],
  methods: {
    authToken: [{ scheme: "auth_token", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "auth_token", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
