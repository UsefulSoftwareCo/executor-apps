// data-openapi.json and admin-openapi.json are generated from Google's own Analytics Data API v1beta
// and Analytics Admin API v1beta Discovery documents (revision 20261007) by discovery-to-openapi.mjs;
// see README. Credentials go only to the two Analytics hosts, one per document.
import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";
import data from "./data-openapi.json" with { type: "json" };
import admin from "./admin-openapi.json" with { type: "json" };

// The inferred JSON type has no index signature, so widen it once here.
const widen = (value: unknown): JsonObject => JSON.parse(JSON.stringify(value));

const shared = {
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  methods: {
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} as const;

// These are POST methods that only read; marking them queries keeps reports free of approvals.
const dataQueries = [
  "runReport", "checkCompatibility", "runPivotReport", "runRealtimeReport", "batchRunReports",
  "batchRunPivotReports", "audienceExports.query",
].map((name) => `analyticsdata.properties.${name}`);
const adminQueries = [
  "analyticsadmin.properties.runAccessReport",
  "analyticsadmin.accounts.runAccessReport",
  "analyticsadmin.accounts.searchChangeHistoryEvents",
];
const asQueries = (ids: readonly string[]) => Object.fromEntries(ids.map((id) => [id, "query" as const]));

export const dataOptions = {
  ...shared,
  kinds: asQueries(dataQueries),
  source: { document: widen(data) },
  allowedOrigin: "https://analyticsdata.googleapis.com",
} satisfies OpenapiToolNamesOptions;

export const adminOptions = {
  ...shared,
  kinds: asQueries(adminQueries),
  source: { document: widen(admin) },
  allowedOrigin: "https://analyticsadmin.googleapis.com",
} satisfies OpenapiToolNamesOptions;

// scripts/tools.ts counts this one; the admin document is counted by the README check below.
export const options = adminOptions;
