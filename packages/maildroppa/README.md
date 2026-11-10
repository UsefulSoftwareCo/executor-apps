# Maildroppa

Manage Maildroppa email marketing: subscribers, tags, custom fields, segments, RSS newsletters, e-commerce events (carts and orders), reports, forms and webhook subscriptions.

Interface: Maildroppa's official OpenAPI 3.1 document, served at https://api.maildroppa.com/openapi (interactive docs at https://api.maildroppa.com; the API is labelled Beta). The spec declares no `servers`, so the package sets `baseUrl` and pins the origin to `https://api.maildroppa.com`.

Auth: API key only. Each account has one key; create or rotate it on the API Key page of the Maildroppa app (guide: https://maildroppa.com/guides/api-key). It is sent in the `X-API-Key` header (never as a Bearer token). The key grants access to the whole account. Maildroppa offers no user-created OAuth apps. Health check calls `GET /account`.

Known gaps: the spec includes some `/internal/...` and WooCommerce plugin-pairing endpoints. These are vendor-internal, are exposed as published, and may be changed or removed by Maildroppa. Transactional sending is covered by the single `POST /transactional-emails/{transactionalEmailId}/send` operation. Every non-GET operation is treated as a mutation and requires approval, including read-style POSTs (`/subscribers/filtered`, `/subscribers/filtered-count`, `/segments/preview`, `/rss-newsletters/preview`); this is deliberate over-approval, since the router offers no per-operation kind override here.
