// openapi.json is converted from Google's own YouTube Data API v3 Discovery document
// (https://youtube.googleapis.com/$discovery/rest?version=v3) by
// scripts/google-discovery.ts; see README. Every operation takes an OAuth bearer token.
import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

type Json = null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };

// The inferred JSON type has no index signature, so widen it once here.
const widen = (value: unknown): JsonObject => JSON.parse(JSON.stringify(value));

// GET operations that also accept a plain API key, for public data; everything else needs OAuth.
const publicReads = [
  "activities",
  "channels",
  "channelSections",
  "commentThreads",
  "comments",
  "i18nLanguages",
  "i18nRegions",
  "playlistItems",
  "playlists",
  "search",
  "subscriptions",
  "videoAbuseReportReasons",
  "videoCategories",
  "videos",
];

const withKey: Json = [{ bearer: [] }, { apiKey: [] }];

export const options = {
  source: { document: widen(document) },
  allowedOrigin: "https://youtube.googleapis.com",
  securitySchemes: {
    bearer: { type: "http", scheme: "bearer" },
    apiKey: { type: "apiKey", in: "query", name: "key" },
  },
  methods: {
    apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
  patches: publicReads.map((name) => ({
    op: "replace" as const,
    path: `/paths/~1youtube~1v3~1${name}/get/security`,
    value: withKey,
  })),
} satisfies OpenapiToolNamesOptions;
