# Tripletex

Tripletex accounting through the 807 operations of Tripletex's official OpenAPI document (customers, suppliers, products, orders, invoices, ledger, projects, timesheets, salary, travel expenses and more). Mutations require approval.

Interface: OpenAPI, `https://tripletex.no/v2/openapi.json` (served by Tripletex itself, with the real-time document at `https://tripletex.no/v2-docs/`).

## Auth

API tokens (`apiKey` method): a consumer token and an employee token. The consumer token identifies the integration (request it from Tripletex for your integration; Tripletex gives an own-use test consumer token on request) and the employee token is created by the user in Tripletex under Settings, API access ("API-tilgang"). The app exchanges them for a session token with `PUT /token/session/:create` (valid two days, cached and renewed) and calls the API with Basic auth `0:<session token>`.

Tripletex has no user-created OAuth apps for this API, so no `oauth2` method is offered.

## Known gaps

- Production host `tripletex.no` only; the test environment (`api-test.tripletex.io`) is not wired.
- The company id in the Basic username is fixed to `0` (the employee token's own company). Accountants acting on a client company by id are not supported.
- The health check exchanges the tokens for a session (the provider health context has no cache, so each check creates one) and then calls the read-only `GET /v2/token/session/>whoAmI`. The document's own `token/session` operations are exposed as tools but are not needed; the app manages sessions.
- Icon is the official mark from tripletex.no.
