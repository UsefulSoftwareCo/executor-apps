# MerchantPro

Manage a MerchantPro store: products (with variants and images), categories, orders (status changes, invoices, AWB, fulfillment, notes, tags), customers, inventory stock and prices, discount rules and coupons, read access to brands, suppliers, attributes, price lists, reviews, subscribers, abandoned carts, blog and site pages, and the shop taxonomy (currencies, statuses, carriers, taxes, warehouses). Plus `api.request` for any v2 endpoint without a dedicated tool.

## Interface

Hand-written tools over MerchantPro's REST API v2, documented at https://docs.merchantpro.com/api/. MerchantPro publishes no OpenAPI or Swagger document. Create and update tools take a JSON `body` as described on each resource's docs page. List tools take `filters`, `fields`, `include`, `sort`, `start` and `limit`. Every create, update, delete and `api.request` call requires approval. The API lives on each store's own domain: `https://<store>/api/v2`.

## Auth

API user and secret (HTTP Basic). In the store admin open Settings > API and webhooks > API Users, create an API user, and enter its user, secret and the store domain (for example `www.example.com`) when connecting. Grant the user the permissions it needs (discount rules need the `discounts` permission).

No OAuth: MerchantPro's OAuth 2.1 server (https://docs.merchantpro.com/api/oauth2) has no dynamic client registration and only issues manually registered clients through support, and the shop MCP server (`https://<store>/mcp`) is read-only and tied to those tokens, so neither is self-service.

## Known gaps

- SECURITY: store domains are arbitrary, and the framework only accepts exact hosts or one-level wildcards, so the provider declares no `hosts`. Because of this the API secret reaches app code as a real value and the Basic header is built in app code, i.e. app code can read the API secret. This needs either framework support for per-account hosts or explicit acceptance of the exposure; neither has happened yet. Mitigations: https is required, redirects are never followed, and requests are pinned to the account's own origin under `/api/v2`.
- Full create/update/delete is wired for products, categories, customers and discount rules (orders: create/update; inventory by id, sku or ean). Other resources (brands, suppliers, attributes, price lists, reviews, subscribers, carts, blog, site pages, locations, shipping packages) are list/get only; their write endpoints are reachable through `api.request`.
- Every read-only resource path was checked against its docs endpoint page (brands, suppliers, attributes, attribute_groups, product_lines, product_tags, product_reviews, product_price_changes, product_stock_changes, price_lists, customer_groups, customer_subscriptions, newsletter_subscribers, abandoned_carts, articles, blog_categories, site_pages, locations/countries|states|cities, shipping_packages). Price/stock change logs and shipping packages have list only; states and cities need country_id or country_code. The docs contradict themselves on order notes/tags (endpoint sections say POST, examples show PATCH); POST, the documented endpoint verb, is used. Not verified against a live store (no credentials were used).
