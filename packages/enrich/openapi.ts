import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./spec.json" with { type: "json" };

// spec.json is assembled from the OpenAPI snippets embedded in each endpoint page of Enrich's
// official docs (https://doc.enrich.so); the vendor publishes no single downloadable file.
// GET operations that charge or settle credits, so they ask for approval like mutations.
const creditSpendingGets = [
  "phoneLookup",
  "getEmailFinderBatchResults",
  "getIpToCompanyBatchResults",
  "getDomainSearchBatchResults",
  "getEmailValidationBatchResults",
  "getBulkLookupResults",
  "getPhoneBulkJobResults",
  "getPersonalEmailBatchResults",
  "getCompanyFollowerResults",
  "getExportJob",
] as const;

export const options = {
  kinds: Object.fromEntries(creditSpendingGets.map((id) => [id, "mutation" as const])),
  source: { document: document as never },
  allowedOrigin: "https://dev.enrich.so",
  securitySchemes: { ApiKeyHeader: { type: "apiKey", name: "x-api-key", in: "header" } },
  methods: { apiKey: [{ scheme: "ApiKeyHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
