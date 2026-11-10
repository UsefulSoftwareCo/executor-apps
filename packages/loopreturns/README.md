# Loop Returns

Manage a Loop Returns shop: look up, process, cancel, flag and close returns, build returns step by step
(draft returns), grade items and assess dispositions, report fraud, manage orders, products, customers,
collections, inventories and locations, run bulk operations, maintain allowlist and blocklist entries,
destinations, carts, label requests and Happy Returns shipments.

Interface: OpenAPI. Loop publishes one official OpenAPI document per API at
`https://docs.loopreturns.com/openapi/<name>.yaml` (returns-api, draft-returns, dispositioning-api,
fraud-reports-api, orders-api, products-api, customers-api, collections-api, inventories-api, locations-api,
bulk-operations-api, listings-api, destinations-api, carts-api, labels-api, happy-returns-shipment-items-api,
outgoing-webhooks-api, checkout-plus-api). Each is mounted under its own key in one router (147 tools, all
compiled with 0 skipped). Everything is served from `https://api.loopreturns.com/api/v1`, except Checkout+
(`checkoutPlus`), which is the storefront API at `https://api.loopreturns.com/storefront/v1`.

## Auth

API key. In the Loop Admin go to Returns Management > Tools & integrations > Developer Tools
(https://admin.loopreturns.com/settings/developers), click Generate API key and tick the scopes you need
(Returns, Orders, Carts, Destinations, Happy Returns Shipments, and the commerce-data scopes). The key is sent in the
`X-Authorization` header. A tool whose scope the key lacks answers 401. The health check calls `GET /auth/me`.

OAuth 2.0 is not offered: Loop only issues OAuth client credentials to partners through an application form
(no self-service OAuth apps), so a normal user cannot complete it.

## Known gaps

- The HQ API (`hq-api`, Auth0 client credentials on a different host) and Ship by Loop API (`ship-by-loop-api`,
  OAuth authorization code, partner-only) are not mounted.
- The Programmatic Webhooks API is covered (`webhooks`); its operations accept the API key with the
  developer_tools scope, so tick that scope when generating the key.
- `GET /auth/me` is used for the health check although it has no documentation page; it appears in Loop's
  official Postman collection.
- The icon is Loop's app icon from loopreturns.com (no SVG is published).
