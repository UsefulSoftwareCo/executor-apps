import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// document.json merges the per-operation OpenAPI definitions SmartRecruiters publishes on each
// endpoint page of https://developers.smartrecruiters.com (the customer-facing APIs only). Each
// API's server path prefix (for example /user-api/v201804) is folded into its paths, so every
// operation lives under https://api.smartrecruiters.com. Partner-hosted callbacks are left out.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.smartrecruiters.com",
  securitySchemes: { key: { type: "apiKey", in: "header", name: "x-smarttoken" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ key: [] }],
  methods: { apiKey: [{ scheme: "key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
