import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// Fidel publishes no standalone OpenAPI file. Each page of reference.fidel.uk embeds the
// OpenAPI 3.1 definition of its own endpoint(s) (the "OpenAPI definition" block, also served as
// <page>.md). document.json merges those per-page definitions unchanged except that the
// Fidel-Key and Content-Type header parameters are dropped (auth is applied by the framework)
// and the mid-insights path loses a stray "/v1" prefix that duplicates the server URL.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.fidel.uk",
  securitySchemes: { sec0: { type: "apiKey", in: "header", name: "Fidel-Key" } },
  methods: { apiKey: [{ scheme: "sec0", field: "key", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
