import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// openapi.json is generated from Google's official BigQuery v2 Discovery document
// (https://bigquery.googleapis.com/$discovery/rest?version=v2) by convert-discovery.mjs, so it
// covers all 47 methods. Every operation requires one OAuth bearer token.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://bigquery.googleapis.com",
  securitySchemes: { Oauth2: { type: "http", scheme: "bearer" } },
  methods: {
    oauth: [{ scheme: "Oauth2", field: "access_token", part: "value", prefix: "" }],
  },
  // These POST operations only read.
  kinds: {
    "bigquery.tables.getIamPolicy": "query",
    "bigquery.tables.testIamPermissions": "query",
    "bigquery.routines.getIamPolicy": "query",
    "bigquery.routines.testIamPermissions": "query",
    "bigquery.rowAccessPolicies.getIamPolicy": "query",
    "bigquery.rowAccessPolicies.testIamPermissions": "query",
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
