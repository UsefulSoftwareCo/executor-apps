# Zylvie

Zylvie is cart software for creators selling digital products and subscriptions. This package covers the whole public API: the authenticated account, products (create, update, delete), coupons (list, create, update, delete, email grants), transactions, subscriptions, license keys (verify, redeem, refund, uploaded codes) and webhook subscriptions.

## Interface

Hand-written tools over the REST API at `https://api.zylvie.com`, documented at https://developers.zylvie.com/. Zylvie publishes no OpenAPI document and no MCP server. Every mutation requires approval.

## Auth

API key only. Zylvie offers no OAuth. Copy the key from Settings > API in the Zylvie dashboard and paste it into the connect form; it is sent as `Authorization: Bearer <key>` to `api.zylvie.com`. The health check calls `GET /me`.

## Known gaps

- The API has no endpoint to list or fetch products or affiliates, so products can only be created, updated and deleted by id.
- The docs' curl examples are inconsistent about JSON versus form bodies; these tools send JSON.
- Webhook events are delivered to your URL and are not exposed as tools.
