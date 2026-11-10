# Order Desk

Order Desk (orderdesk.com) is an ecommerce order management platform. This package exposes 25 hand-written tools over its REST API v2: store settings and folders, orders (search, get, create, update, delete, move between folders, add history notes), order line items, shipments (including batch create) and inventory items (including batch update).

**Interface:** custom tools using `fetch` against `https://app.orderdesk.me/api/v2`, written from the vendor's API reference at https://help.orderdesk.com/api-documentation. Order Desk publishes no standalone OpenAPI document (the docs embed a spec per page only), so there is no spec to mount.

**Auth:** API key only, as Order Desk offers no OAuth. In Order Desk open Store Settings, then the API tab, create an API key and copy it with the Store ID. The connect form asks for both; they are sent as the `ORDERDESK-STORE-ID` and `ORDERDESK-API-KEY` headers. A wrong Store ID blocks the store from the API, so double-check it. The health check calls `GET /test`.

**Notes and gaps:** update operations replace the whole record, so fetch first and resend every field. Create and update bodies are passed as JSON objects (fields are described in each tool). The `store` tool returns only the store ID, name and folders; the vendor's `settings` object (API key, SMTP credentials) is dropped before it reaches the agent. Inventory search paging (limit/offset) is not documented by the vendor, so it is not exposed; the response reports `total_records` and `records_returned`. Models, folder rules and webhooks-style integrations configured inside Order Desk are not exposed. All mutations require approval.
