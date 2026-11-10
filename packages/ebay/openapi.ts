import type { OpenapiToolNamesOptions } from "apps/openapi";

// eBay serves its official OpenAPI 3 contracts at stable URLs under
// https://developer.ebay.com/api-docs/master/<domain>/<api>/openapi/3/<name>_oas3.json. Every contract declares
// one oauth2 scheme named `api_auth`; it is replaced by a bearer scheme of the same name so both the OAuth
// application token and a pasted user token authorize requests.
const api = (path: string, origin = "https://api.ebay.com") => ({
  source: { url: `https://developer.ebay.com/api-docs/master/${path}` },
  allowedOrigin: origin,
  securitySchemes: { api_auth: { type: "http", scheme: "bearer" } },
  methods: {
    oauth: [{ scheme: "api_auth", field: "access_token", part: "value" as const, prefix: "" }],
    token: [{ scheme: "api_auth", field: "token", part: "value" as const, prefix: "" }],
  },
  oauth: [],
}) satisfies OpenapiToolNamesOptions;

export const apis = {
  browse: api("buy/browse/openapi/3/buy_browse_v1_oas3.json"),
  deal: api("buy/deal/openapi/3/buy_deal_v1_oas3.json"),
  buyFeed: api("buy/feed/openapi/3/buy_feed_v1_beta_oas3.json"),
  buyMarketing: api("buy/marketing/openapi/3/buy_marketing_v1_beta_oas3.json"),
  buyOffer: api("buy/offer/openapi/3/buy_offer_v1_beta_oas3.json"),
  buyOrder: api("buy/order/openapi/3/buy_order_v2_oas3.json", "https://apix.ebay.com"),
  catalog: api("commerce/catalog/openapi/3/commerce_catalog_v1_beta_oas3.json"),
  charity: api("commerce/charity/openapi/3/commerce_charity_v1_oas3.json"),
  identity: api("commerce/identity/openapi/3/commerce_identity_v1_oas3.json", "https://apiz.ebay.com"),
  media: api("commerce/media/openapi/3/commerce_media_v1_beta_oas3.json", "https://apim.ebay.com"),
  notification: api("commerce/notification/openapi/3/commerce_notification_v1_oas3.json"),
  taxonomy: api("commerce/taxonomy/openapi/3/commerce_taxonomy_v1_oas3.json"),
  translation: api("commerce/translation/openapi/3/commerce_translation_v1_beta_oas3.json"),
  vero: api("commerce/vero/openapi/3/commerce_vero_v1_oas3.json"),
  developerAnalytics: api("developer/analytics/openapi/3/developer_analytics_v1_beta_oas3.json"),
  account: api("sell/account/openapi/3/sell_account_v1_oas3.json"),
  sellAnalytics: api("sell/analytics/openapi/3/sell_analytics_v1_oas3.json"),
  sellFeed: api("sell/feed/openapi/3/sell_feed_v1_oas3.json"),
  finances: api("sell/finances/openapi/3/sell_finances_v1_oas3.json", "https://apiz.ebay.com"),
  fulfillment: api("sell/fulfillment/openapi/3/sell_fulfillment_v1_oas3.json"),
  // The payment dispute operations are served from apiz.ebay.com; the rest of the contract from api.ebay.com.
  disputes: api("sell/fulfillment/openapi/3/sell_fulfillment_v1_oas3.json", "https://apiz.ebay.com"),
  inventory: api("sell/inventory/openapi/3/sell_inventory_v1_oas3.json"),
  logistics: api("sell/logistics/openapi/3/sell_logistics_v1_oas3.json"),
  sellMarketing: api("sell/marketing/openapi/3/sell_marketing_v1_oas3.json"),
  metadata: api("sell/metadata/openapi/3/sell_metadata_v1_oas3.json"),
  negotiation: api("sell/negotiation/openapi/3/sell_negotiation_v1_oas3.json"),
  recommendation: api("sell/recommendation/openapi/3/sell_recommendation_v1_oas3.json"),
  stores: api("sell/stores/openapi/3/sell_stores_v1_oas3.json"),
} as const;

// scripts/tools.ts reads `options`; the Browse API is the main one.
export const options = apis.browse;
