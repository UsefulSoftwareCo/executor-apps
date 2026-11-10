import type { OpenapiToolNamesOptions } from "apps/openapi";

// These POST operations only read data (filters travel in the body), so they are queries.
const kinds: Record<string, "query" | "mutation"> = {
  "activityRecords.postActivitiesRecordsQuery": "query",
  "records.postObjectsQuery": "query",
  "records.postObjectsSearch": "query",
  "sql.postSql": "query",
  "entries.postListsQuery": "query",
};

// Attio's own OpenAPI document. Every operation names its `oauth2` scheme, but workspace access
// tokens and OAuth tokens are both sent as a bearer token, so the scheme is declared as http bearer.
export const options = {
  source: { url: "https://api.attio.com/openapi/api" },
  allowedOrigin: "https://api.attio.com",
  securitySchemes: { oauth2: { type: "http", scheme: "bearer" } },
  methods: {
    token: [{ scheme: "oauth2", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
  kinds,
} satisfies OpenapiToolNamesOptions;
