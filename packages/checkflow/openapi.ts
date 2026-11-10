import type { OpenapiToolNamesOptions } from "apps/openapi";

// CheckFlow is hosted per region (US and EU); index.ts swaps in the account's origin.
export const placeholderOrigin = "https://api.checkflow.io";

export const options = {
  source: { url: "https://api.checkflow.io/openapi/v3.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "X-API-KEY" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
