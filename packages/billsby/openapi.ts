import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./spec.json" with { type: "json" };

// spec.json is the `/public/api/v1/{companyDomain}` slice of Billsby's own swagger document
// (https://api.billsby.com/swagger/v1/swagger.json), with paths moved to the public gateway's
// `/api/v1/rest/core/{companyDomain}` prefix and the `apikey` header scheme added.
// This GET emails the customer (summary: "Send request to customer to change payment details"), so gate it as a mutation.
// The spec has no operationIds, so overrides are keyed by tool name.
const kinds: Record<string, "query" | "mutation"> = {
  "customers.getRestCorePaymentdetailsrequest": "mutation",
};

export const options = {
  source: { document: document as never },
  allowedOrigin: "https://public.billsby.com",
  baseUrl: "https://public.billsby.com",
  securitySchemes: { apiKey: { type: "apiKey", name: "apikey", in: "header" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  kinds,
} satisfies OpenapiToolNamesOptions;
