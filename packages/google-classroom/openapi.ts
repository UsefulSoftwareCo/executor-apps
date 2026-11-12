// openapi.json is converted from Google's own Classroom API v1 Discovery document
// (https://classroom.googleapis.com/$discovery/rest?version=v1) by
// scripts/google-discovery.ts; see README. Every operation takes one OAuth bearer token.
import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// The inferred JSON type has no index signature, so widen it once here.
const widen = (value: unknown): JsonObject => JSON.parse(JSON.stringify(value));

export const options = {
  source: { document: widen(document) },
  allowedOrigin: "https://classroom.googleapis.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  methods: {
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
