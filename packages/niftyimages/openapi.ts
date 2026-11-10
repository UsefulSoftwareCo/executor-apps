import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://dev.niftyimages.com/openapi/v1.json" },
  allowedOrigin: "https://dev.niftyimages.com",
  securitySchemes: { Bearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "Bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Read-only POST operations (lookups, search, count, aggregate, dry-run validate).
  kinds: {
    LookupImageByUrl: "query",
    LookupStoreRecord: "query",
    ValidateStoreRecord: "query",
    SearchStoreRecords: "query",
    CountStoreRecords: "query",
    AggregateStoreRecords: "query",
  },
} satisfies OpenapiToolNamesOptions;
