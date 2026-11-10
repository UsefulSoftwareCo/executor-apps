# Zoho Bigin

Covers Zoho Bigin's REST API v2 with 25 hand-written tools: records (list, get, search, COQL, related records, create, update, bulk update, upsert, delete) across Contacts, Accounts (Companies), Pipelines, Products, Tasks, Events and Calls; notes; tags; module, field, layout, related-list and custom-view metadata; users and organization details.

## Interface

Custom tools over `fetch`, written from Zoho's own docs at <https://www.bigin.com/developer/docs/apis/v2/>. Zoho publishes no OpenAPI document for Bigin (it does for CRM and Inventory, but not this product), and the only remote MCP option is a per-account server the user builds in Zoho MCP, so there is no official spec or server to mount. Base URL is `https://www.zohoapis.<dc>/bigin/v2`. Every mutation asks for approval.

## Auth

OAuth 2.0 only. A pasted access token lasts one hour, so no API-key method is offered. There is one method per Zoho data center: US, EU, India, Australia, Japan, Canada, Saudi Arabia and China. Pick the one matching the domain of your Bigin web app (`bigin.zoho.eu` is EU).

Create the client in the Zoho API Console for your data center (<https://api-console.zoho.com>, or the `.eu`, `.in`, ... equivalent): a Server-based Application, with Executor's redirect URI shown on the connect page as the authorized redirect URI. Paste its client ID and secret into the connect page. Scopes are `ZohoBigin.modules.ALL`, `ZohoBigin.settings.ALL`, `ZohoBigin.users.READ`, `ZohoBigin.org.READ`, `ZohoBigin.coql.READ` (documented on Zoho's COQL page) and `ZohoSearch.securesearch.READ` (required by record search), comma-separated as Zoho requires, with `access_type=offline` and `prompt=consent` so Zoho returns a refresh token. Tokens go in the `Authorization: Zoho-oauthtoken <token>` header.

## Notes and gaps

- `records.list` requires `fields` (Zoho rejects the call without it); read API names with `metadata.listFields`.
- Record search requires `ZohoSearch.securesearch.READ` on top of the module scope, per Zoho's search docs; it is requested. COQL requires `ZohoBigin.coql.READ`, also requested.
- Not covered: bulk read/write jobs, notification (webhook) APIs, attachments and photos, user management, and roles/profiles.
- Zoho limits calls per minute and per day by plan.
