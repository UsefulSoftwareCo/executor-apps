# Keyword.com

Keyword.com SEO rank tracking and AI visibility monitoring: projects and groups,
keywords, ranking history, top pages, share of voice, alerts, on-demand refreshes
and AI search visibility, from Keyword.com's hosted MCP server.

Interface: Keyword.com's official remote MCP server, `https://app.keyword.com/mcp`
(Streamable HTTP; docs: https://keyword.com/docs/mcp/). Tools are whatever the
server lists for the account. A live tools/list returns 67 tools (46 marked
read-only, 21 not); the vendor's meta description says 56, but its page body lists 67. The REST APIs
(SERP Tracker v2 and AI Visibility, base `https://app.keyword.com/api/v2`) are
documented only as Postman pages and llms.txt, with no OpenAPI document found, so
the MCP server is the interface.

Auth:

- OAuth (`oauth`): the server publishes OAuth metadata and a dynamic client
  registration endpoint (`/oauth/register`), so Executor registers its own client
  and no manual OAuth app is needed. Scopes `read:schema`, `read:data`,
  `write:data`, `write:keywords`, `write:exports` and `write:alerts` (the full set
  the authorization server advertises; the protected resource lists only four). Sign in with a Keyword.com user (a free trial
  works). Executor's redirect URI is shown on the connect page.

Approvals: every tool the server does not mark read-only asks for approval; the
vendor notes `delete_project` and `delete_keywords` cannot be undone.

Known gaps: the API token (Settings > Account, `Authorization: Bearer`) used by
the REST API is not offered. The MCP server's 401 mentions an undocumented
`X-MCP-API-Key` header and accepted a bogus one at the transport level, but the
vendor docs say MCP has no API keys and never mention that header, and it was not
tested with a real key. No secrets method is offered until the vendor confirms a user-created MCP key works. Account
health only verifies the token reaches the MCP server. The icon is the K mark from
https://keyword.com/favicon.svg.
