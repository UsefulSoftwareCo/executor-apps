# Postman

Postman workspaces, collections, folders, requests, environments, API specs,
mock servers, monitors, tags and client code generation, exposed to agents.

Interface: Postman's official remote MCP server (streamable HTTP), full
configuration, `https://mcp.postman.com/mcp`, documented at
https://learning.postman.com/docs/developer/postman-api/postman-mcp-server/set-up-postman-mcp-server/
(100+ tools). Postman publishes no OpenAPI document for its
REST API (`https://api.getpostman.com`), so the MCP server is the interface.
Listing tools needs credentials, so no tool count is verified here.

Auth:

- API key (`apiKey`): create a Postman API key at
  https://go.postman.co/settings/me/api-keys and paste it; it is sent as
  `Authorization: Bearer <key>`.
- OAuth (`oauth`): the server publishes OAuth metadata with dynamic client
  registration (PKCE S256), so Executor registers its own client; no manual
  OAuth app is needed. The redirect URI is shown on the connect page.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: US region only. The EU server (`mcp.eu.postman.com`) is API key
only and is not wired. Account health only verifies the credential reaches the
MCP server. The icon is the Postman mark from Simple Icons.
