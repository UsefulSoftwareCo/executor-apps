import type { OpenapiToolNamesOptions } from "apps/openapi";

// Botsonic's own FastAPI document. Management endpoints take the account-wide USER-API-KEY; per-bot
// endpoints take that bot's key (X-BOT-KEY, or `token` for /v1/botsonic/generate).
export const options = {
  source: { url: "https://api.botsonic.ai/openapi.json" },
  allowedOrigin: "https://api.botsonic.ai",
  securitySchemes: {
    APIKeyHeader: { type: "apiKey", in: "header", name: "token" },
    api_key_header_auth: { type: "apiKey", in: "header", name: "X-BOT-KEY" },
    global_key_header_auth: { type: "apiKey", in: "header", name: "USER-API-KEY" },
  },
  methods: {
    userKey: [{ scheme: "global_key_header_auth", field: "token", part: "value", prefix: "" }],
    botKey: [
      { scheme: "api_key_header_auth", field: "token", part: "value", prefix: "" },
      { scheme: "APIKeyHeader", field: "token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
