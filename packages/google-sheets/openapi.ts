// openapi.json is converted from Google's own Sheets API v4 Discovery document
// (https://sheets.googleapis.com/$discovery/rest?version=v4) by
// scripts/google-discovery.ts; see README. Every operation takes one OAuth bearer token.
import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// The inferred JSON type has no index signature, so widen it once here.
const widen = (value: unknown): JsonObject => JSON.parse(JSON.stringify(value));

export const options = {
  source: { document: widen(document) },
  allowedOrigin: "https://sheets.googleapis.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  methods: {
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  // These POST operations only read, so they run without an approval prompt.
  kinds: {
    "sheets.spreadsheets.developerMetadata.search": "query",
    "sheets.spreadsheets.values.batchGetByDataFilter": "query",
    "sheets.spreadsheets.getByDataFilter": "query",
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
