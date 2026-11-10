import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi-document.json" with { type: "json" };

export const liveOrigin = "https://live.dodopayments.com";
export const testOrigin = "https://test.dodopayments.com";

// Dodo publishes no standalone OpenAPI file. Its docs embed the official per-operation OpenAPI
// fragments (https://docs.dodopayments.com/api-reference/...); openapi-document.json is those 145
// fragments merged, with the live server only. The test host is chosen per account in index.ts.
export const options = {
  source: { document: document as never },
  allowedOrigin: liveOrigin,
  baseUrl: liveOrigin,
  securitySchemes: { API_KEY: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "API_KEY", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
