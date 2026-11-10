# Eventzilla

Manage Eventzilla events, ticket types, orders, attendees and check-ins, and run the checkout flow (prepare, create, fill, confirm).

Interface: hand-written tools over the Eventzilla REST API v2 (`https://www.eventzillaapi.net/api/v2`), documented at https://developer.eventzilla.net/docs/. Eventzilla publishes its OpenAPI document only embedded in that documentation page (there is no stable spec URL), so the 20 operations in it are written out by hand and were checked against that embedded spec. Mutations require approval.

Auth: API key, sent as the `x-api-key` header. Create it in Eventzilla under Settings > Developers > API Credentials by creating an application (https://www.eventzilla.net/admin/ManageSettings?mode=appmanagement). The docs describe only API key auth. The health check calls `GET /events?limit=1`, since `/categories` answers 200 even for an invalid key.

Known gaps: webhooks (documented separately by Eventzilla) are not exposed. Response bodies are returned as untyped JSON.
