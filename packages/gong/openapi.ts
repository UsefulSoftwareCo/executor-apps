import type { OpenapiToolNamesOptions } from "apps/openapi";
import { document } from "./spec.ts";

// Gong's reference publishes one OpenAPI document per operation; spec.ts merges them.
// Both methods send the credential as an Authorization header: Basic for an API key
// (access key and secret), Bearer for an OAuth access token.
// These POST operations only read data (filters travel in the body).
const kinds = {
  listMultipleUsers: "query",
  listInteractionStats: "query",
  listAnsweredScorecards: "query",
  listMultipleUsersDayByDayActivity: "query",
  listMultipleUsersAggregateActivity: "query",
  listMultipleUsersAggregateByPeriod: "query",
  listCallsExtensive: "query",
  getCallTranscripts: "query",
  getUsersAccessToCalls: "query",
  getFlowsForProspects: "query",
  listTasks: "query",
} as const;

export const options = {
  kinds,
  source: { document: document as never },
  allowedOrigin: "https://api.gong.io",
  securitySchemes: {
    basic: { type: "http", scheme: "basic" },
    bearer: { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: [{ basic: [] }, { bearer: [] }] as { [scheme: string]: string[] }[],
  methods: {
    apiKey: [
      { scheme: "basic", field: "accessKey", part: "username", prefix: "" },
      { scheme: "basic", field: "accessKeySecret", part: "password", prefix: "" },
    ],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
