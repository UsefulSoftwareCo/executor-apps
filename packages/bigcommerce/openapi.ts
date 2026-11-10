import type { OpenapiToolNamesOptions } from "apps/openapi";

// BigCommerce publishes one official OpenAPI document per API area in
// https://github.com/bigcommerce/api-specs (reference/). index.ts mounts each under its own key with the
// store's own origin; the placeholder store hash below is only used to compile.
const spec = (path: string) => ({
  url: `https://raw.githubusercontent.com/bigcommerce/api-specs/main/reference/${path}`,
});

const origin = "https://api.bigcommerce.com";

const api = (path: string, version: "v2" | "v3") =>
  ({
    source: spec(path),
    allowedOrigin: origin,
    baseUrl: `${origin}/stores/store_hash/${version}`,
    securitySchemes: { "X-Auth-Token": { type: "apiKey", in: "header", name: "X-Auth-Token" } },
    methods: {
      accessToken: [{ scheme: "X-Auth-Token", field: "token", part: "value", prefix: "" }],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

// Every API by its router key.
export const apis = {
  catalogProducts: api("catalog/products_catalog.v3.yml", "v3"),
  catalogVariants: api("catalog/product-variants_catalog.v3.yml", "v3"),
  catalogVariantOptions: api("catalog/product-variant-options_catalog.v3.yml", "v3"),
  catalogModifiers: api("catalog/product-modifiers_catalog.v3.yml", "v3"),
  catalogCategories: api("catalog/categories_catalog.v3.yml", "v3"),
  catalogCategoryTrees: api("catalog/category-trees_catalog.v3.yml", "v3"),
  catalogBrands: api("catalog/brands_catalog.v3.yml", "v3"),
  orders: api("orders.v2.oas2.yml", "v2"),
  ordersSettings: api("orders.v3.yml", "v3"),
  carts: api("carts.v3.yml", "v3"),
  checkouts: api("checkouts.v3.yml", "v3"),
  abandonedCarts: api("abandoned_carts.v3.yml", "v3"),
  abandonedCartEmails: api("abandoned_cart_emails.v3.yaml", "v3"),
  customers: api("customers.v3.yml", "v3"),
  customersV2: api("customers.v2.yml", "v2"),
  channels: api("channels.v3.yml", "v3"),
  sites: api("sites.v3.yml", "v3"),
  priceLists: api("price_lists.v3.yml", "v3"),
  pages: api("pages.v3.yml", "v3"),
  redirects: api("redirects.v3.yml", "v3"),
  scripts: api("scripts.v3.yml", "v3"),
  themes: api("themes.v3.yml", "v3"),
  widgets: api("widgets.v3.yml", "v3"),
  emailTemplates: api("email_templates.v3.yml", "v3"),
  customTemplateAssociations: api("custom-template-associations.v3.yml", "v3"),
  storeContent: api("store_content.v2.yml", "v2"),
  storeInformation: api("store_information.v2.yml", "v2"),
  storeLogs: api("store_logs.v3.yml", "v3"),
  settings: api("settings.v3.yml", "v3"),
  marketing: api("marketing.v2.yml", "v2"),
  shipping: api("shipping.v2.yml", "v2"),
  shippingV3: api("shipping.v3.yml", "v3"),
  tax: api("tax.v3.yml", "v3"),
  taxClasses: api("tax_classes.v2.yml", "v2"),
  taxProperties: api("tax_properties.v3.yml", "v3"),
  taxRatesZones: api("tax_rates_zones.v3.yml", "v3"),
  taxSettings: api("tax_settings.v3.yml", "v3"),
  currencies: api("currencies.v2.yml", "v2"),
  geography: api("geography.v2.yml", "v2"),
  storefrontTokens: api("storefront_tokens.v3.yml", "v3"),
  subscribers: api("subscribers.v3.yml", "v3"),
  webhooks: api("webhooks.v3.yml", "v3"),
  wishlists: api("wishlists.v3.yml", "v3"),
  paymentMethods: api("payments/methods_payments.v2.yml", "v2"),
  acceptedPaymentMethods: api("payments/accepted-methods_payments.v3.yml", "v3"),
  paymentAccessTokens: api("payments/access-tokens_payments.v3.yml", "v3"),
} as const;

// scripts/tools.ts reads `options`; the Catalog Products API is the main one.
export const options = apis.catalogProducts;
