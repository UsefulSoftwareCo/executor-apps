# Attio

Attio CRM: records, objects and attributes, lists and entries, notes, tasks, comments, threads, meetings, call recordings, webhooks, workspace members and files. 97 tools (53 mutations, all approval-gated), generated live from Attio's own OpenAPI document at https://api.attio.com/openapi/api.

## Auth

- **Access token** (`token`): create a workspace access token in Attio under Workspace settings > Developers > Access tokens, and grant it the scopes you want tools for.
- **OAuth** (`oauth`): create an app at https://build.attio.com (Developers > Apps), enable OAuth, and choose its scopes there. Attio does not take a `scope` parameter on the authorize request, so scopes are fixed on the app. Add the redirect URI shown on the connect page to the app, then paste the client ID and secret on the connect page. Attio has no dynamic client registration.

Credentials go only to `api.attio.com`; the OAuth endpoints are on `app.attio.com`.

## Notes

- Attio also runs an official remote MCP server (https://mcp.attio.com/mcp), but the REST API exposes more operations, so this package uses the OpenAPI document.
- The icon is the Attio mark from attio.com (Simple Icons has no Attio entry).
- Gaps: tools whose scope was not granted to the token return a 403 from Attio.
