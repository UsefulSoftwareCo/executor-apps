# Magic Patterns

Magic Patterns AI interface design for agents: create and iterate on designs,
inspect design status and history, read or modify artifact files, and publish
authorized design artifacts.

Interface: Magic Patterns' official remote MCP server (streamable HTTP),
`https://mcp.magicpatterns.com/mcp`. Tools are whatever the server lists for the
account; listing needs credentials, so no tool count is
verified here. This also covers the catalog's "Magic Patterns MCP" target. No
public OpenAPI document was found.

Auth:

- OAuth (`oauth`): the server publishes OAuth metadata (authorization server
  `https://oauth.magicpatterns.com`, WorkOS-backed) with dynamic client
  registration, so Executor registers its own client; no manual OAuth app is
  needed. Scopes: `openid email profile offline_access`. The redirect URI is
  shown on the connect page.

- API key (`apiKey`): create one at Settings > API Keys
  (https://www.magicpatterns.com/settings/api-keys). It is shown once and needs a
  paid Magic Patterns plan. It is sent as `Authorization: Bearer mp_...` to the
  same MCP URL; when a key is present the vendor skips the OAuth flow.

The vendor also serves a read-only endpoint, `https://mcp.magicpatterns.com/mcp/readonly`
(10 read tools, accepts OAuth and API keys). This package uses the full endpoint;
mutating tools require approval.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: account health only verifies
the token reaches the MCP server. The icon is the symbol cropped from the
official gradient logo SVG on magicpatterns.com.
