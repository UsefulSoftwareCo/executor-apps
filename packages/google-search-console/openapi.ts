import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// openapi.json is generated from Google's official Search Console Discovery document
// (https://searchconsole.googleapis.com/$discovery/rest?version=v1) by convert-discovery.mjs. It holds
// the sites, sitemaps, search analytics and URL inspection methods; the retired Mobile-Friendly Test is left out.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://searchconsole.googleapis.com",
  securitySchemes: { Oauth2: { type: "http", scheme: "bearer" } },
  methods: {
    oauth: [{ scheme: "Oauth2", field: "access_token", part: "value", prefix: "" }],
  },
  // These POST operations only read.
  kinds: {
    "webmasters.searchanalytics.query": "query",
    "searchconsole.urlInspection.index.inspect": "query",
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
