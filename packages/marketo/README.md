# Marketo

Adobe Marketo Engage in one package: leads, companies, opportunities, lists, static and smart campaigns, programs and program members, activities, custom objects, bulk lead and activity exports and imports, assets (emails, email templates, forms, landing pages, files, folders, tokens, snippets, tags, channels) and user management (users, roles, workspaces).

**Interface:** OpenAPI. Adobe's official Swagger 2.0 documents from the AdobeDocs/marketo-apis repository, the source of https://developer.adobe.com/marketo-apis/ (`https://raw.githubusercontent.com/AdobeDocs/marketo-apis/main/static/swagger-<name>.json`). Marketo publishes one document per area; each is mounted under its own key in one router (379 tools, none skipped):

| Key | Document | Tools |
| --- | --- | --- |
| `leads` | `swagger-mapi.json` (Lead Database, REST and bulk) | 147 |
| `assets` | `swagger-asset.json` | 220 |
| `users` | `swagger-user.json` | 12 |

Each document lists `localhost:8080` as its host, so every call is sent to the account's own `https://<munchkin-id>.mktorest.com`.

**Auth:** client credentials. Marketo has no user-facing OAuth authorization flow; REST access uses a LaunchPoint service. Create an API-only user and role (Admin > Users & Roles), then a "Custom" service (Admin > Integration > LaunchPoint > New) for that user and copy its Client ID and Client Secret. Take the REST host from Admin > Integration > Web Services (the Endpoint, without `/rest`), for example `123-ABC-456.mktorest.com`. Enter the host, Client ID and Client Secret; the package mints a bearer token from `<host>/identity/oauth/token` and refreshes it before it expires. Credentials are only sent to `*.mktorest.com`. Health is checked by describing the lead object (`GET /rest/v1/leads/describe.json`). What a call may do depends on the API user's role permissions.

**Approvals:** every non-GET operation asks for approval. Read-only POSTs, if any, also ask.

**Known gaps:** the Data Ingestion API (`mkto-ingestion-api.adobe.io`, Adobe IMS auth), Marketo's tag-based Munchkin tracking and instances behind a custom REST domain are not included. Marketo reports most errors as HTTP 200 with `success: false`.
