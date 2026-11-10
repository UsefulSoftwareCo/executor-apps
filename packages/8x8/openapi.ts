import type { OpenapiToolNamesOptions } from "apps/openapi";

// Official OpenAPI documents published by 8x8 in https://github.com/8x8Cloud/public-developer-docs (docs_oas).
// The Admin Provisioning and Audit APIs authenticate with an Admin Console API key in the x-api-key header; the
// Contact Center analytics APIs use OAuth 2 client credentials against https://api.8x8.com/oauth/v2/token.
const spec = (path: string) => ({
  url: `https://raw.githubusercontent.com/8x8Cloud/public-developer-docs/master/docs_oas/${path}`,
});

const origin = "https://api.8x8.com";

const apiKeyAuth = {
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ ApiKeyAuth: [] }],
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "apiKey", part: "value", prefix: "" }] },
  oauth: [],
} as const;

const bearerAuth = {
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ bearerAuth: [] }],
  methods: { oauth: [{ scheme: "bearerAuth", field: "access_token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

const admin = (file: string) =>
  ({
    source: spec(`administration/${file}`),
    allowedOrigin: origin,
    baseUrl: `${origin}/admin-provisioning`,
    ...apiKeyAuth,
  }) satisfies OpenapiToolNamesOptions;

export const usersOptions = admin("user-api-v1.yaml");
export const sitesOptions = admin("site-api-v1.yaml");
export const ringGroupsOptions = admin("ringgroup-api-v1.yaml");
export const phoneNumbersOptions = admin("phonenumber-api-v1.yaml");
export const addressesOptions = admin("address-api-v1.yaml");
export const operationsOptions = admin("operation-api-v1.yaml");

export const auditOptions = {
  source: spec("analytics/audit_records_api.json"),
  allowedOrigin: origin,
  baseUrl: `${origin}/administration/audit/v1`,
  ...apiKeyAuth,
} satisfies OpenapiToolNamesOptions;

// The historical report creation endpoints only submit a query for a report; they are mutations here, so they ask
// for approval like every other write.
export const realtimeOptions = {
  source: spec("analytics/8x8_analytics_for_contact_center_real-time_metrics_api.json"),
  allowedOrigin: origin,
  baseUrl: `${origin}/analytics/cc/v5/realtime-metrics`,
  ...bearerAuth,
} satisfies OpenapiToolNamesOptions;

export const historicalOptions = {
  source: spec("analytics/8x8_analytics_for_contact_center_historical_metrics_api.json"),
  allowedOrigin: origin,
  baseUrl: `${origin}/analytics/cc/v8/historical-metrics`,
  ...bearerAuth,
} satisfies OpenapiToolNamesOptions;

// Realtime and historical analytics publish regional servers (/eu, /au, /ca) next to the default US origin. An
// oauth2 client-credentials account has no region field, so each region is its own mount.
const regional = (region: string, base: typeof realtimeOptions | typeof historicalOptions) =>
  ({ ...base, baseUrl: base.baseUrl.replace(origin, `${origin}/${region}`) }) satisfies OpenapiToolNamesOptions;
export const realtimeEuOptions = regional("eu", realtimeOptions);
export const realtimeAuOptions = regional("au", realtimeOptions);
export const realtimeCaOptions = regional("ca", realtimeOptions);
export const historicalEuOptions = regional("eu", historicalOptions);
export const historicalAuOptions = regional("au", historicalOptions);
export const historicalCaOptions = regional("ca", historicalOptions);

// Contact Center Chat API v2 (OAuth bearer). The region and tenant are path parameters of each tool.
export const chatOptions = {
  source: spec("actions-events/8x8_contact_center_chat_api_v2.json"),
  allowedOrigin: origin,
  baseUrl: origin,
  securitySchemes: { "8x8APIBearerToken": { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ "8x8APIBearerToken": [] }],
  methods: { oauth: [{ scheme: "8x8APIBearerToken", field: "access_token", part: "value", prefix: "" }] },
  oauth: [],
  // Public operations keep no security (catalog/status/8x8.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1vcc~1{region}~1chat~1v2~1jwk~1{jwk-id}~1public/get/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;

// Outbound campaign management (x-api-key). The customer site is a path parameter.
export const campaignsOptions = {
  source: spec("actions-events/8x8_contact_center_new_campaigns.json"),
  allowedOrigin: origin,
  baseUrl: origin,
  pathPrefix: "/cc/{customer-site}/campaigns/v1",
  ...apiKeyAuth,
} satisfies OpenapiToolNamesOptions;

// Work Chat API (x-api-key).
export const workChatOptions = {
  source: spec("actions-events/chapi_-_chat_api.json"),
  allowedOrigin: origin,
  baseUrl: `${origin}/chat`,
  ...apiKeyAuth,
} satisfies OpenapiToolNamesOptions;

// Customer 360 (x-api-key), US region server.
export const customer360Options = {
  source: spec("analytics/customer_360_public_api.json"),
  allowedOrigin: origin,
  baseUrl: `${origin}/cidp-customer-360/us`,
  ...apiKeyAuth,
} satisfies OpenapiToolNamesOptions;

// scripts/tools.ts checks this export.
export const options = usersOptions;
