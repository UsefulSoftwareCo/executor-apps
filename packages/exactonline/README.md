# Exact Online

Exact Online accounting and ERP: relations, contacts, addresses, opportunities, quotations, sales and purchase documents, general ledger, journals, bank and cash entries, receivables and payables, items, warehouses, projects, time entries, employees and subscriptions. 132 tools.

## Interface

Hand-written tools over Exact Online's REST API v1 (OData v3), documented at https://start.exactonline.nl/docs/HlpRestAPIResources.aspx. Exact publishes no OpenAPI document and no official MCP server, so the tools are a curated list of the commonly used endpoints: each has `list`, most have `get`, and writable ones have `create`, `update` and (where Exact allows it) `delete`. Every tool takes an optional `division`; it defaults to the user's current division. All mutations require approval.

## Auth

OAuth 2.0 authorization code, one sign-in method per Exact Online country site (.nl, .com, .be, .de, .fr, .co.uk, .es), because each site has its own sign-in and API host. Pick the method that matches the site where your Exact Online account lives.

Register an app in the Exact Online App Center (https://apps.exactonline.com, "Register API keys") on the same country site. Set the redirect URI to the one Executor shows on the connect page, then give Executor the app's client ID and client secret. Exact has no OAuth scopes: the rights of the signed-in user apply.

## Known gaps

- No API key method; Exact Online only supports OAuth 2.0.
- Not covered: payroll, bulk and sync endpoints, report endpoints and file attachments beyond the Documents entity.
- Exact limits calls to roughly 60 per minute and 5,000 per day per division; lists return at most 60 rows, so follow `__next` with `$skiptoken`.
- Tools were not exercised against a live account.
