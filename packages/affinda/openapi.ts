import type { OpenapiToolNamesOptions } from "apps/openapi";

// Affinda is hosted per region (api, api.eu1, api.us1); index.ts swaps in the account's origin.
export const placeholderOrigin = "https://api.affinda.com";

export const options = {
  source: { url: "https://api.affinda.com/static/v3/api_spec.yaml" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { ApiKeyAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
