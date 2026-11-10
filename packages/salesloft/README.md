# Salesloft

People, accounts, cadences, calls, emails and meetings in the Salesloft sales
engagement platform.

Interface: Salesloft's official remote MCP server, `https://mcp.salesloft.com/mcp`.
Salesloft's REST API docs (https://developers.salesloft.com/docs/api/) are built from
an OpenAPI source that is not published at any public URL, so the MCP server is used.
Tools are whatever the server lists for the account; the list needs credentials, so
no tool count is recorded.

Auth:

- OAuth (`oauth`): the server publishes OAuth metadata (authorization server
  `https://accounts.salesloft.com/mcp`) and dynamic client registration with PKCE
  S256, so Executor registers its own client. No API-key option is offered: Salesloft
  API keys work for the REST API, not documented for the MCP server.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: the REST-only endpoints (bulk jobs, imports, webhooks) are not exposed
unless the MCP server provides them. Account health only verifies the token reaches
the MCP server. The icon is Salesloft's own app icon (https://salesloft.com/icon.svg).
