# Zoho Desk

Covers the whole Zoho Desk REST API (909 tools): tickets and their threads, comments, attachments, tags, followers, approvals and time entries; contacts and accounts; agents, teams, roles, profiles and departments; help center articles, categories and translations; community topics; tasks, calls and events; products; SLAs and contracts; blueprints, layouts, fields and automation rules; instant messaging channels; webhooks and imports.

## Interface

OpenAPI 3.1, from Zoho's own definitions at <https://github.com/zoho/zohodesk-oas> (`v1.0/`). Zoho publishes one file per resource with cross-file `$ref`s into `Common.json` and no combined file, so `document.json` is those files merged by `generate.py` (components are prefixed with their source file, unreferenced ones dropped, security replaced by one `Zoho_Auth` header scheme, and `orgId` declared as the header Zoho Desk reads; the published file says query). To refresh it, clone the repository into a fresh directory and run `python3 generate.py <clone>/v1.0 document.json`. The definition names only the US host; `index.ts` pins the account's own data center as the only origin that receives credentials.

## Auth

OAuth 2.0 only. A pasted access token lasts one hour, so no API-key method is offered, and the framework has no secrets-method hook to exchange a refresh token. There is one method per Zoho data center: US, EU, India, Australia, Japan, Canada, Saudi Arabia, the United Arab Emirates, Singapore and China. Pick the method matching the domain you see in the Zoho Desk web app (`desk.zoho.eu` is EU).

Create the client in the Zoho API Console for your data center (<https://api-console.zoho.com>, or the `.eu`, `.in`, ... equivalent): a Server-based Application, with Executor's redirect URI shown on the connect page as the authorized redirect URI. Paste its client ID and secret into the connect page. The scopes are the `Desk.<module>.ALL` scopes Zoho's OpenAPI files define (tickets, contacts, settings, articles, tasks, webhooks, accounts, activities.calls/events/tasks and others), plus `Desk.search.READ` and explicit READ/CREATE/UPDATE/DELETE scopes for organization, teams, permissions and featuresettings (comma-separated). Bulk export and import (`Desk.exports.CUSTOM`, `Desk.imports.CUSTOM`) are not requested, so those tools will return scope errors, with `access_type=offline` and `prompt=consent` so Zoho returns a refresh token. Tokens go in the `Authorization: Zoho-oauthtoken <token>` header.

## Notes and gaps

- Most calls need the `orgId` header; read it with the organizations tools (also shown in the account name).
- One operation is skipped because the source definition references a response that is not in the repository (`external_reference`). Two duplicate path and method pairs in `DirectAssignmentRules.json` are dropped.
- Zoho limits API calls by plan and edition.
- Mutations ask for approval on every call.
