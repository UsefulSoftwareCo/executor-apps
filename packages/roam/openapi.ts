import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Roam product, three official specs from https://developer.ro.am: the Roam API (chat, groups, users,
// meetings, magicasts, lobbies, calendar), On-Air and Webhooks. All three live under https://api.ro.am/v1.
const credentials = {
  allowedOrigin: "https://api.ro.am",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  methods: {
    apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} as const;

const api = <const K extends Record<string, "query">>(file: string, kinds: K) =>
  ({ source: { url: `https://developer.ro.am/${file}.json` }, ...credentials, kinds }) satisfies OpenapiToolNamesOptions;

// POST operations that only read or ask questions are kinds=query, so they run without an approval prompt.
export const chatOptions = api("chat-v1", {
  "chat.search": "query",
  "chat.link.resolve": "query",
  "meeting.link.info": "query",
  "meeting.prompt": "query",
});
export const onairOptions = api("onair", {});
export const webhooksOptions = api("webhooks-v1", {});

// scripts/tools.ts reads `options`; it covers the main API, the other two are checked separately.
export const options = chatOptions;
