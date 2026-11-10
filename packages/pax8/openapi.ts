import type { OpenapiToolNamesOptions } from "apps/openapi";

// Official OpenAPI documents published at https://devx.pax8.com/openapi/ (partner, quoting, webhooks, vendor
// provisioning, vendor usage). index.ts mints the client-credentials token, so the bearer scheme is a placeholder
// filled from the client secret field and then replaced by the token-minting fetch.
const spec = (name: string) => ({ url: `https://devx.pax8.com/openapi/${name}.json` });
const origin = "https://api.pax8.com";

const partnerAuth = {
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { partner: [{ scheme: "bearerAuth", field: "clientSecret", part: "value", prefix: "" }] },
  oauth: [],
} as const;

export const partnerOptions = {
  source: spec("partner-endpoints"),
  allowedOrigin: origin,
  baseUrl: `${origin}/v1`,
  securitySchemes: { OAuth2: { type: "http", scheme: "bearer" } },
  methods: { partner: [{ scheme: "OAuth2", field: "clientSecret", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

export const quotingOptions = {
  source: spec("quoting-endpoints"),
  allowedOrigin: origin,
  baseUrl: origin,
  ...partnerAuth,
} satisfies OpenapiToolNamesOptions;

export const webhooksOptions = {
  source: spec("webhooks-api"),
  allowedOrigin: origin,
  baseUrl: `${origin}/api/v2`,
  securitySchemes: { OAuth2: { type: "http", scheme: "bearer" } },
  methods: { partner: [{ scheme: "OAuth2", field: "clientSecret", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

export const provisioningOptions = {
  source: spec("vendor-provisioning-endpoints"),
  allowedOrigin: origin,
  baseUrl: `${origin}/v2`,
  securitySchemes: { OAuth2: { type: "http", scheme: "bearer" } },
  methods: { vendor: [{ scheme: "OAuth2", field: "clientSecret", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

export const usageOptions = {
  source: spec("vendor-usage-endpoints"),
  allowedOrigin: origin,
  baseUrl: `${origin}/v2/usage`,
  securitySchemes: { OAuth2: { type: "http", scheme: "bearer" } },
  methods: { vendor: [{ scheme: "OAuth2", field: "clientSecret", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

// scripts/tools.ts checks this export.
export const options = partnerOptions;
