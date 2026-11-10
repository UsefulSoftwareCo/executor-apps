# Smartsheet

Sheets, rows, columns, cells, attachments, discussions, workspaces, folders, reports, dashboards (Sights), users, groups, sharing, events and webhooks in Smartsheet.

## Interface

OpenAPI, from Smartsheet's official document: https://developers.smartsheet.com/_spec/api/smartsheet/openapi.yaml (187 tools). Mutations require approval.

## Auth

- **API token** (`token`): in Smartsheet go to Account > Personal Settings > API Access and generate a token. Sent as a Bearer token.
- **OAuth 2.0** (`OAuth2`): create an app under Account > Developer Tools (a developer profile is required first), then Create New App. Smartsheet has no dynamic client registration, so the connect page asks for the app's client ID and secret. Set the app's redirect URL to the callback URL Executor shows on the connect page; Smartsheet requires HTTPS. Endpoints: `https://app.smartsheet.com/b/authorize` and `https://api.smartsheet.com/2.0/token`.

Requested scopes: READ/WRITE/CREATE/DELETE/SHARE/ADMIN_SHEETS, READ/CREATE/DELETE/SHARE/ADMIN_SIGHTS, ADMIN_WORKSPACES, READ_CONTACTS, READ_USERS, ADMIN_USERS, READ_EVENTS, ADMIN_WEBHOOKS. This is all 17 scopes Smartsheet documents. ADMIN_USERS is only needed for the user and group administration tools; remove it if you do not want those.

Token endpoint: Smartsheet's docs show `client_id` and `client_secret` sent as plain form parameters (it also offers an optional `hash` parameter instead of sending the code and secret in plaintext), so `client_secret_post` is used. This was not verified against a live OAuth app, since no real accounts were connected during authoring.

## Known gaps

- US host only (`api.smartsheet.com`). EU, AU and Gov regions use other hosts and are not covered.
- The Resource Management API is a separate product and is not covered.
- Smartsheet's official MCP server is not mounted: it requires OAuth without dynamic client registration.
