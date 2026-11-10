import type { OpenapiToolNamesOptions } from "apps/openapi";

// Honeycomb runs separate US and EU API hosts; index.ts pins the account's own region as the only
// origin that receives credentials.
export const regions = {
  us: "https://api.honeycomb.io",
  eu: "https://api.eu1.honeycomb.io",
} as const;

// Configuration keys travel in X-Honeycomb-Team; management keys (team-level, "id:secret") are bearer tokens.
export const options = {
  source: { url: "https://docs.honeycomb.io/api/openapi-public.yaml" },
  allowedOrigin: regions.us,
  baseUrl: regions.us,
  securitySchemes: {
    configuration_key: { type: "apiKey", in: "header", name: "X-Honeycomb-Team" },
    bearerAuth: { type: "http", scheme: "bearer" },
  },
  methods: {
    configurationKey: [{ scheme: "configuration_key", field: "token", part: "value", prefix: "" }],
    managementKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
