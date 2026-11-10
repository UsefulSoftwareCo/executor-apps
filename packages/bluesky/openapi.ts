import type { OpenapiToolNamesOptions } from "apps/openapi";

// Bluesky's official endpoint reference (bluesky-social/endpoints-standalone), generated from the
// lexicons. The app view document covers app.bsky.* and com.atproto.*; chat and Ozone are separate
// documents, mounted under their own keys in index.ts. Every call goes to the account's PDS, which
// proxies app.bsky, chat.bsky and tools.ozone calls to the right service.
const common = {
  allowedOrigin: "https://bsky.social",
  baseUrl: "https://bsky.social",
  securitySchemes: { Bearer: { type: "http", scheme: "bearer" } },
  methods: { appPassword: [{ scheme: "Bearer", field: "appPassword", part: "value", prefix: "" }] },
  oauth: [],
} satisfies Omit<OpenapiToolNamesOptions, "source">;

export const appOptions = {
  ...common,
  source: { url: "https://endpoints.bsky.app/openapi.bluesky-app.json" },
} satisfies OpenapiToolNamesOptions;

export const chatOptions = {
  ...common,
  source: { url: "https://endpoints.bsky.app/openapi.bluesky-dms.json" },
} satisfies OpenapiToolNamesOptions;

export const ozoneOptions = {
  ...common,
  source: { url: "https://endpoints.bsky.app/openapi.ozone-moderation.json" },
} satisfies OpenapiToolNamesOptions;

export const options = appOptions;
