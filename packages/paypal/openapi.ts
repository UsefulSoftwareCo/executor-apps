import type { OpenapiToolNamesOptions } from "apps/openapi";

// PayPal's official REST API documents from
// https://github.com/paypal/paypal-rest-api-specifications/tree/90e8041ffe02d80c452d2b476bedd59a8d219bdc/openapi (pinned commit). Each document declares one OAuth 2.0
// scheme named "Oauth2" (client credentials); the access token is sent as a bearer token. All run on the live origin.
const origin = "https://api-m.paypal.com";

const api = (name: string) =>
  ({
    source: { url: `https://raw.githubusercontent.com/paypal/paypal-rest-api-specifications/90e8041ffe02d80c452d2b476bedd59a8d219bdc/openapi/${name}.json` },
    allowedOrigin: origin,
    baseUrl: origin,
    securitySchemes: { Oauth2: { type: "http", scheme: "bearer" } },
    fallbackSecurity: [{ Oauth2: [] }],
    methods: {
      clientCredentials: [{ scheme: "Oauth2", field: "access_token", part: "value", prefix: "" }],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const apis = {
  orders: api("checkout_orders_v2"),
  payments: api("payments_payment_v2"),
  subscriptions: api("billing_subscriptions_v1"),
  invoicing: api("invoicing_v2"),
  payouts: api("payments_payouts_batch_v1"),
  products: api("catalogs_products_v1"),
  disputes: api("customer_disputes_v1"),
  partnerReferrals: api("customer_partner_referrals_v2"),
  webhooks: api("notifications_webhooks_v1"),
  webExperienceProfiles: api("payment-experience_web_experience_profiles_v1"),
  transactions: api("reporting_transactions_v1"),
  tracking: api("shipping_shipment_tracking_v1"),
  vault: api("vault_payment_tokens_v3"),
} as const;

// scripts/tools.ts reads `options`; Orders is the main one.
export const options = apis.orders;
