# Recharge

Subscription management for Shopify and other storefronts: customers, subscriptions, addresses, charges, orders, one-time products, discounts, products, plans, collections, bundle selections, payment methods, metafields, entitlements, store credit, checkouts, notifications, webhooks and async batches.

**Interface:** custom. Recharge publishes no downloadable OpenAPI document, no GraphQL API and no official remote MCP server that was found, so about 130 tools are hand-written over the official REST API at https://api.rechargeapps.com (docs: https://developer.rechargepayments.com/2021-11). Requests send `X-Recharge-Version: 2021-11`. Path ids are inputs, request bodies go in `body`, filters and cursor pagination (`limit`, `cursor`) go in `query`. Every POST/PUT/DELETE tool requires approval.

**Auth:** API token only. Create it in the Recharge merchant portal under Tools and apps > API tokens (https://support.rechargepayments.com), choosing the read/write scopes you need. It is sent as `X-Recharge-Access-Token`. The health check calls `GET /token_information`. Recharge offers no OAuth for merchants' own use, so none is declared.

**Icon:** the mark cropped from Recharge's official logo SVG (https://getrecharge.com/wp-content/uploads/2025/06/recharge-full.svg).

**Known gaps:** paths and parameters were written from the docs and not called live; some of the less common endpoints (accounts, async batch tasks, notifications, checkout actions) may need adjusting. Customer-facing Storefront API (customer session tokens) is not covered.
