import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// Simla.com publishes its REST API v5 as an OpenAPI 3 definition embedded in the page
// https://rest-api-docs.simla.com/v5/ (no standalone file URL), so document.json is that definition
// verbatim. Each account lives on its own host (<subdomain>.simla.com); index.ts pins the account's
// host as the only origin that receives the key. The origin here is the documentation's demo host.
// The only edit to the published definition: two component schemas (mixed, Classes) that the docs
// generator serialized as empty arrays are empty objects.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://demo.simla.com",
  baseUrl: "https://demo.simla.com",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "X-API-KEY" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // GET /api/v5/statistic/update queues a statistics recalculation (documented as needing analytics_write),
  // so it is a mutation despite the HTTP method.
  kinds: { get_intaro_crm_api_statistic_update_v5: "mutation" },
} satisfies OpenapiToolNamesOptions;
