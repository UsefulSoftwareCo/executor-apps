# Pylon

Covers Pylon, the B2B support platform: search, read, create and update issues, send customer replies and internal notes, manage accounts, contacts, teams, knowledge base articles, tasks and projects.

Interface: Pylon's official remote MCP server at https://mcp.usepylon.com/ (streamable HTTP), documented at https://docs.usepylon.com/pylon-docs/integrations/pylon-mcp. Pylon also has a REST API at https://api.usepylon.com (bearer token), but publishes no downloadable OpenAPI document, so it is not mounted. Its API-token auth (bearer token) is deliberately omitted: the MCP server authenticates with OAuth only, so a REST token cannot be used with it, and the REST surface is not covered by this package.

Auth: OAuth 2.0 only (scopes are left to discovery; the framework adds `offline_access` when the server advertises it and `scopes` is omitted, and Pylon's metadata advertises it, so refresh tokens are issued), discovered from the server's metadata (authorization server https://o.auth.usepylon.com, dynamic client registration, PKCE S256). No client ID or secret needs to be created by hand. The connecting user needs the `MCP Access` role, and an admin must enable the server under Settings > AI Controls > MCP Server in Pylon. Actions run as the authenticated user.

Approvals: every tool without `readOnlyHint` asks for approval. This includes `send_issue_reply`, which messages the customer directly.

Known gaps: only the tools the MCP server exposes are available; REST-only endpoints (audit logs, surveys, macros, ticket forms and others) are not covered.
