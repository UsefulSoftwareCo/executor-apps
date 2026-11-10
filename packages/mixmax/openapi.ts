import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// openapi.json is assembled from the per-endpoint OpenAPI definitions embedded in the pages of
// developer.mixmax.com/reference/<slug>.md (the "OpenAPI definition" block of each page); Mixmax publishes
// no standalone document. See README.md.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.mixmax.com",
  securitySchemes: { sec0: { type: "apiKey", in: "header", name: "X-API-Token" } },
  methods: { apiKey: [{ scheme: "sec0", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  kinds: {
    "reportsdatatable": "query",
  },
} satisfies OpenapiToolNamesOptions;
