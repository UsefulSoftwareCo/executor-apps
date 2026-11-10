// directory.json, reports.json and datatransfer.json are generated from Google's official Admin SDK Discovery
// documents (https://admin.googleapis.com/$discovery/rest?version=directory_v1 | reports_v1 | datatransfer_v1,
// revision 20261004) by discovery-to-openapi.mjs; see README. Every operation takes one OAuth bearer token.
import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";
import datatransfer from "./datatransfer.json" with { type: "json" };
import directory from "./directory.json" with { type: "json" };
import reports from "./reports.json" with { type: "json" };

// The inferred JSON type has no index signature, so widen it once here.
const widen = (value: unknown): JsonObject => JSON.parse(JSON.stringify(value));

const api = (document: unknown) =>
  ({
    source: { document: widen(document) },
    allowedOrigin: "https://admin.googleapis.com",
    securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
    methods: {
      oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const directoryOptions = api(directory);
export const reportsOptions = api(reports);
export const datatransferOptions = api(datatransfer);

// scripts/tools.ts reads `options`; the Directory API is the bulk of the package.
export const options = directoryOptions;
