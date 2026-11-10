import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Wildix product, official OpenAPI 3 documents generated from Wildix's Smithy models and published by the
// vendor's developer portal (https://docs.wildix.com/api-reference) under /codegen/api. index.ts mounts each
// under its own key. Every Wildix API accepts the Company API key as a bearer token. WMS runs on the PBX's own
// host (https://<domain>.wildixin.com), so index.ts swaps in the account's origin for it; the placeholder
// origin below is only used to compile.
const spec = (name: string) => ({ url: `https://docs.wildix.com/codegen/api/${name}.openapi.json` });

// Wildix names its bearer schemes in each document: operations list the Company API key scheme
// (wildix.auth.apiKeys) among their alternatives where it is accepted, or the generic bearer scheme otherwise.
const credentials = (schemes: string[]) =>
  ({
    securitySchemes: Object.fromEntries(schemes.map((scheme) => [scheme, { type: "http", scheme: "bearer" }])),
    methods: { apiKey: schemes.map((scheme) => ({ scheme, field: "apiKey", part: "value" as const, prefix: "" })) },
    oauth: [],
  }) as const;

const apiKeyScheme = "wildix.auth.apiKeys";
const bearerScheme = "smithy.api.httpBearerAuth";
const api = (name: string, origin: string, schemes: string[] = [apiKeyScheme]) =>
  ({ source: spec(name), allowedOrigin: origin, baseUrl: origin, ...credentials(schemes) }) satisfies OpenapiToolNamesOptions;

export const wmsPlaceholderOrigin = "https://domain.wildixin.com";

export const apis = {
  wms: api("wms-api-client", wmsPlaceholderOrigin, [bearerScheme]),
  apiKeys: api("auth-api-keys-client", "https://auth.wildix.com", [bearerScheme]),
  analyticsHistory: api("wda-history-client", "https://wda.wildix.com"),
  analyticsInsights: api("wda-insights-client", "https://wda.wildix.com"),
  analyticsStream: api("wda-stream-client", "https://wda.wildix.com"),
  conversations: api("xbees-conversations-client", "https://api.x-bees.com"),
  users: api("xbees-users-client", "https://api.x-bees.com"),
  kite: api("xbees-kite-client", "https://api.x-bees.com"),
  assistant: api("xbees-assistant-client", "https://api.x-bees.com", [bearerScheme]),
  voicebots: api("wim-voicebots-client", "https://wim.wildix.com", [bearerScheme]),
  integrations: api("wim-integrations-client", "https://wim.wildix.com"),
  knowledgeBase: api("wim-knowledge-base-client", "https://kb.wim.wildix.com"),
} as const;

// scripts/tools.ts reads `options`; WMS is the PBX itself.
export const options = apis.wms;
