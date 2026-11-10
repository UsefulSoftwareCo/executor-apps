# Redo

Manage Redo (getredo.com) e-commerce stores: checkout experiences and A/B tests, shipping protection coverage, customers, bundles, inventory, inbound shipments, returns and comments, invoices, webhooks and events.

**Interface:** OpenAPI, from Redo's official document at https://api.getredo.com/v2.2/openapi.json (v2.2.1). Every mutation requires approval.

**Auth:** API secret (`secrets`). Create it in the Redo dashboard (Settings, API) and copy the secret (`redo_sk_...`); it is sent as a Bearer token. The account also takes your Store ID (24 hex characters, shown in the same settings area), used for the health check; pass the same Store ID as the `storeId` path parameter on tools. Redo offers no OAuth for user-created apps, so only the API secret is supported.

**Gaps:** The spec's `UserBearer` scheme (user tokens) is not offered. Tools that take a `storeId` need it supplied per call. The health check lists the store's webhooks since Redo has no current-user endpoint.
