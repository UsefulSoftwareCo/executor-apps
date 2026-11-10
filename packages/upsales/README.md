# Upsales

Covers the Upsales CRM REST API (v2): list, get, create, update and delete for companies (accounts), contacts, orders and opportunities, agreements, activities, appointments, products, projects and tasks, plus list and get for users.

Interface: hand-written tools over `https://integration.upsales.com/api/v2`. Upsales publishes its API documentation at https://api.upsales.com but no downloadable OpenAPI document that could be found, so no spec is used. The tools pass a raw `filter` query fragment and JSON `body` through, so any documented attribute or field works.

Auth: API token (`apiKey`). In Upsales open your profile, then Settings/Administration, then the API area to view or create a token (API access must be enabled for the account). The token is sent as the `token` query parameter, as the verification call (`GET /api/v2/users`) does.

Known gaps: only the common resources are exposed; other endpoints (mail, pricelists, custom fields, etc.) are not. Request and response shapes are not validated. The write payloads and the query-string syntax were not verified against a live account.
