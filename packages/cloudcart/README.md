# CloudCart

Manage a CloudCart store: products, categories, vendors, variants, properties, stock per store, discounts and discount codes, orders and fulfillment, customers and their addresses, redirects, blog posts, webhooks, and newsletter subscribers, channels, tags and segments. About 160 tools, plus `api.request` for any v2 endpoint without a dedicated tool.

## Interface

Hand-written tools over CloudCart's REST API v2 (JSON:API, `application/vnd.api+json`), documented at https://developers.cloudcart.com/2.0/overview. CloudCart publishes no OpenAPI or Swagger document (only a Postman collection), so each resource gets list/get/create/update/delete tools as its docs allow. Create and update take `attributes` and `relationships` as in the resource's docs page. Every create, update, delete and `api.request` call requires approval. The API lives on each store's own host: `https://<store>/api/v2`.

## Auth

API key. In the store admin open Settings > API keys (`https://<your-store>/admin/settings/api_keys`), create a key, and enter it with the store domain (for example `mystore.cloudcart.com`) when connecting. The key is sent as the `X-CloudCart-ApiKey` header. CloudCart offers no OAuth for the API.

## Known gaps

- Only stores on `*.cloudcart.com` or `*.cloudcart.net` are supported, because credentials may only go to declared hosts; stores on a custom domain cannot connect.
- Resource paths follow the docs' endpoint headings (for example blog posts at `/posts`, blog categories at `/blogs`); if the live API differs, use `api.request`.
- Product relationship endpoints beyond linked products (for example a product's images or variants) are not documented as product sub-routes; list `images` and `variants` with filters instead, or use `api.request`.
- Redirects are never followed (`redirect: "manual"`), so the API key cannot be forwarded to another host.
- Paths were checked against each resource's vendor docs page (order-status, order-payment, order-shipping(-address), order-billing-address, customer-billing-address, store-quantity, product-options, order-fulfillment, discount-codes-pro, blogs, tags, authors). Blog categories at `/blogs` and tags at `/tags` are stated on their resource pages. `orders/{id}/products` is inferred, not documented; prefer `orderProducts` with a filter.
- Not verified against a live store (no credentials were used).
