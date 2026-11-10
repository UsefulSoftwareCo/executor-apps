import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Cloudbeds product, ten official documents from https://github.com/cloudbeds/openapi-specs/tree/main/src.
// index.ts mounts each under its own key. All are served from https://api.cloudbeds.com.
const spec = (file: string) => ({
  url: `https://raw.githubusercontent.com/cloudbeds/openapi-specs/main/src/${file}`,
});

const origin = "https://api.cloudbeds.com";

// Scopes are chosen on the credentials in Cloudbeds' App Details page, not in the authorize request
// (https://developers.cloudbeds.com/docs/alternative-oauth-20-authentication-method), so none are declared.
const authorizationCode = {
  authorizationUrl: `${origin}/api/v1.3/oauth`,
  tokenUrl: `${origin}/api/v1.3/access_token`,
  scopes: {},
};

// PMS v1.3: the document leaves its OAuth URLs blank, so they are declared here.
export const options = {
  source: spec("pms-v1.3-openapi.yaml"),
  allowedOrigin: origin,
  securitySchemes: {
    api_key: { type: "apiKey", name: "x-api-key", in: "header" },
    OAuth2: { type: "oauth2", flows: { authorizationCode } },
  },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ api_key: [] }, { OAuth2: [] }] as Record<string, string[]>[],
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  oauth: ["OAuth2"],
  // Public operations keep no security (catalog/status/cloudbeds.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1access_token/post/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;

// Every other document authenticates with "Authorization: Bearer <token>", which Cloudbeds documents for API keys
// (cbat_...) and OAuth access tokens. The scheme name is the one each document's operations require.
const bearer = (file: string, scheme: string, baseUrl: string = origin) =>
  ({
    source: spec(file),
    allowedOrigin: origin,
    baseUrl,
    securitySchemes: { [scheme]: { type: "http", scheme: "bearer" } },
    // The document declares no security; send the account's credential on every operation but the public ones below.
    fallbackSecurity: [{ [scheme]: [] }],
    // OAuth accounts (method OAuth2) send their access token in the same header.
    methods: {
      apiKey: [{ scheme, field: "token", part: "value", prefix: "" }],
      OAuth2: [{ scheme, field: "access_token", part: "value", prefix: "" }],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const pmsV2Options = bearer("pms-v2.0-openapi.yaml", "default");
export const insightsOptions = {
  ...bearer("cloudbeds-insights-v1.1-openapi.json", "Authorization"),
  // Public operations keep no security (catalog/status/cloudbeds.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1datainsights~1v1.1~1health/get/security", value: [] },
    { op: "add", path: "/paths/~1datainsights~1v1.1~1liveness/get/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;
export const accountingOptions = bearer("accounting-v1.0-openapi.json", "bearerAuth");
// The document's server is the relative "/guest-profiles/v1".
export const guestProfilesOptions = bearer("guest-profiles-v1.0-openapi.yaml", "superAdmin", `${origin}/guest-profiles/v1`);
export const groupProfileOptions = bearer("group-profile-v1.0-openapi.yaml", "bearerAuth");
export const payByLinkOptions = bearer("pay-by-link-v2.0-openapi.json", "bearerAuth", `${origin}/payments/v2`);
export const paymentElementOptions = bearer("payment-element-api-key-v1.0-openapi.json", "bearerAuth", `${origin}/payments/sdk-api`);
export const fiscalDocumentOptions = bearer("fiscal-document-v1.0-openapi.yaml", "bearerAuth");
export const attributeTaggingOptions = bearer("attribute-tagging-v1-openapi.yaml", "bearerAuth");
