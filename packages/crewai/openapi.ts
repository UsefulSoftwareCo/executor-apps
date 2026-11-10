import type { OpenapiToolNamesOptions } from "apps/openapi";

// Every deployed crew has its own origin (https://<crew>.crewai.com); index.ts swaps in the account's.
export const placeholderOrigin = "https://your-actual-crew-name.crewai.com";

export const options = {
  source: { url: "https://docs.crewai.com/enterprise-api.en.yaml" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
