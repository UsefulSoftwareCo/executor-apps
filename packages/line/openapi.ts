import type { OpenapiToolNamesOptions } from "apps/openapi";

// One LINE product, several official specs from https://github.com/line/line-openapi. Each is mounted
// under its own key in index.ts. Every operation takes the channel access token as a bearer token.
// Pinned to a commit of line/line-openapi (main as of 2026-09-29) so the tool surface only changes with a commit here.
const specCommit = "fa5577c9ea874d2dbd8fadc85a4cb3a1b29d8cbe";
const spec = (name: string) => ({
  url: `https://raw.githubusercontent.com/line/line-openapi/${specCommit}/${name}.yml`,
});

const credentials = {
  securitySchemes: { Bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ Bearer: [] }],
  methods: { token: [{ scheme: "Bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

const api = <const K extends Record<string, "query">>(name: string, origin: string, kinds: K) =>
  ({ source: spec(name), allowedOrigin: origin, ...credentials, kinds }) satisfies OpenapiToolNamesOptions;

// Validation endpoints are POSTs that send nothing, so they run without an approval prompt.
export const messagingOptions = api("messaging-api", "https://api.line.me", {
  validateReply: "query",
  validatePush: "query",
  validateMulticast: "query",
  validateNarrowcast: "query",
  validateBroadcast: "query",
  validateRichMenuObject: "query",
  validateRichMenuBatchRequest: "query",
});
export const insightOptions = api("insight", "https://api.line.me", {});
export const audienceOptions = api("manage-audience", "https://api.line.me", {});
export const liffOptions = api("liff", "https://api.line.me", {});

export const apis = {
  messaging: messagingOptions,
  insight: insightOptions,
  audience: audienceOptions,
  liff: liffOptions,
} as const;

// scripts/tools.ts reads `options`; the Messaging API is the main one.
export const options = messagingOptions;
