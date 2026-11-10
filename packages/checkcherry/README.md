# Check Cherry

Check Cherry is business management software for photography and event companies. This package exposes its Business API: leads, bookings, events, appointments, proposals, payments, packages, add-ons, extras, questionnaires, checklists, staff check-ins, expenses, availability and reports (172 tools, 104 of them mutations that need approval).

Interface: OpenAPI, the vendor's official document at https://www.checkcherry.com/api-docs/v1/business.json (reference at https://www.checkcherry.com/api/docs?spec=business). Base URL `https://api.checkcherry.com/api/v1/`.

## Auth

- **Integration key** (`apiKey`): in Check Cherry go to Manage, Business Settings, Integrations, API Overview, API Keys, and create an Integration Key (starts with `ik_`). It is sent as the `Api-Key` header. A key carries its own permissions, so a tool fails with 403 if the key lacks the matching permission; choose permissions when creating it.
- **OAuth** (`oauth`): authorization code with PKCE (S256), no client secret (public client). Check Cherry's OAuth is for apps registered through its Partner Program: email support@checkcherry.com, create an app at https://www.checkcherry.com/developer/apps, enable OAuth, add the redirect URI shown on the Executor connect page (it must be `https://`), pick the permissions, and paste the Client ID.

## Known gaps

- The spec declares `Api-Key` as a required parameter on every operation; `openapi.ts` patches it out of every operation (including `POST /events/{event_id}/event_payments`) so the account credential is injected instead of the agent passing it.
- One operation (the design templates variant with an inline query string in its path) is skipped.
- The spec's webhooks are not exposed as tools.

## Notes

- Check Cherry rotates the OAuth refresh token on every refresh (the old one stops working). The Executor framework's handling of a rotated `refresh_token` was not verifiable from its docs or types, so this is unconfirmed.
- Under OAuth, the OAuth health check uses `GET /api/v1/add_on_categories` (needs `offerings_read`); the API key check uses `GET /api/v1/support_articles`.
