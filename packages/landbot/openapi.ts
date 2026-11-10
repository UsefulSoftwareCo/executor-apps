import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Landbot product, four official OpenAPI documents from dev.landbot.io, all served from api.landbot.io.
// index.ts mounts each under its own key. The Platform API is the stable one; the Bots API is v0-alpha.
const credentials = {
  securitySchemes: { agentToken: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "agentToken", field: "token", part: "value", prefix: "Token " }] },
  oauth: [],
} as const;

const api = (name: string, baseUrl: string) =>
  ({
    source: { url: `https://dev.landbot.io/api-reference/${name}/openapi.json` },
    allowedOrigin: "https://api.landbot.io",
    baseUrl,
    ...credentials,
  }) satisfies OpenapiToolNamesOptions;

export const platformOptions = api("platform", "https://api.landbot.io/v1");
export const botsOptions = api("bots-api", "https://api.landbot.io/v0-alpha");
export const aiAgentsOptions = api("ai-agents-api", "https://api.landbot.io/v3");
export const channelsOptions = api("channels-api", "https://api.landbot.io");

export const options = platformOptions;
