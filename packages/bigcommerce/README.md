# BigCommerce

Manage a BigCommerce store: catalog (products, variants, modifiers, categories, brands), orders, carts,
checkouts, abandoned carts, customers, price lists, channels and sites, pages, redirects, scripts, themes,
widgets, email templates, store settings, shipping, tax, currencies, geography, marketing (coupons,
promotions, banners), webhooks, wishlists, storefront tokens, subscribers and payment methods.

## Interface

OpenAPI. BigCommerce publishes one official document per API area in
[bigcommerce/api-specs](https://github.com/bigcommerce/api-specs) (`reference/`). All 46 Admin REST documents
are mounted in one router, each under its own key (`catalogProducts`, `orders`, `customers`, ...), against
`https://api.bigcommerce.com/stores/<store hash>/v2|v3`, for about 530 tools. Every mutation asks for approval.

## Auth

API account access token. In the store control panel go to Settings > API > Store-level API accounts >
Create API account, pick the OAuth scopes the tools need (Modify for full use), save, and copy the access
token (shown once). The store hash is the code in the API path shown on that page,
`https://api.bigcommerce.com/stores/<store hash>/v3/`. Enter both when connecting. Requests send the token in
the `X-Auth-Token` header.

OAuth is not offered: BigCommerce's OAuth flow is for marketplace apps installed from inside a store (the
store admin triggers the authorize step and the token response is bound to that store), which does not fit a
user-created OAuth client connecting on its own.

## Known gaps

- Storefront APIs (`*.sf.yml`, same-origin on the store's domain), the Payment Processing API
  (`payments.bigcommerce.com`) and the provider-implemented Tax Provider and Shipping Provider specs are not
  mounted, as they use other origins or are implemented by apps rather than called.
- GraphQL Storefront API and the BigCommerce MCP servers are not used; the REST API covers the Admin surface.
