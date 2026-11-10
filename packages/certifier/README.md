# Certifier

Digital certificates and badges on Certifier: list, search, create, issue, send, update and delete credentials, manage credential groups (templates), and inspect design templates.

## Interface

Two interfaces, chosen by the auth method. With OAuth the app uses Certifier's official remote MCP server, `https://api.certifier.io/v1/mcp` (docs: https://developers.certifier.io/docs/api-reference/mcp-server); tools are discovered live and the tool count is unknown without an authorized listing. With an access token it uses a hand-written router over Certifier's REST API (`https://api.certifier.io/v1`, version header `Certifier-Version: 2022-10-26`) covering credentials (list, get, search, create, issue, send, create-issue-send, update, delete), credential interactions, credential templates, design templates, email templates and attributes (20 tools). Certifier publishes no OpenAPI document (the docs site serves HTML at `/openapi.json`), so the REST tools are written by hand; the endpoint paths come from the docs index, and credential templates are still served under `/groups` and design templates under `/designs`. Mutations require approval.

## Auth

- Access token: create one at Settings, Developers, Access Tokens in the Certifier dashboard (https://developers.certifier.io/docs/api-reference/quickstart). Sent as `Authorization: Bearer <token>`.
- OAuth 2.0 with dynamic client registration and PKCE (metadata at `https://api.certifier.io/.well-known/oauth-authorization-server`, scopes `mcp:read` and `mcp:write`). Sign in to Certifier and pick the workspace to authorize. No OAuth app needs to be created by hand.

## Known gaps

- Webhook management is not covered by the REST tools.
- The icon is Certifier's official 180px app icon (PNG), since neither Simple Icons nor a clean SVG is available.
