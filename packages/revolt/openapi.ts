import type { OpenapiToolNamesOptions } from "apps/openapi";

// Revolt was renamed Stoat and its API moved from api.revolt.chat to api.stoat.chat; both serve
// the same document. Operations declare only the `x-session-token` scheme. Bot accounts send the
// same token as `x-bot-token`; index.ts renames the header for those accounts.
export const options = {
  source: { url: "https://api.stoat.chat/openapi.json" },
  allowedOrigin: "https://api.stoat.chat",
  securitySchemes: { "Session Token": { type: "apiKey", in: "header", name: "x-session-token" } },
  methods: {
    botToken: [{ scheme: "Session Token", field: "token", part: "value", prefix: "" }],
    sessionToken: [{ scheme: "Session Token", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
