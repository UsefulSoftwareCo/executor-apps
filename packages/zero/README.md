# Zero

Zero is a CRM. This package searches and manages companies, contacts, deals,
tasks, notes, quotes, lists, files, calendar events, reports, outreach sequences
and lead search in a Zero workspace, such as `find_companies`, `add_deal`,
`edit_contact`, `add_note`, `sequences_list` and `read_report` (about 100 tools;
the server lists the exact set per account).

Interface: Zero's official remote MCP server, `https://api.zero.inc/mcp`
(https://docs.zero.inc/developers/mcp). Zero's REST API (`https://api.zero.inc`,
documented at https://docs.zero.inc/developers/api, currently in beta) publishes
no OpenAPI document and covers far fewer operations, so the MCP server is used.

Auth:

- OAuth (`oauth`): the MCP server publishes OAuth metadata and dynamic client
  registration (authorization code with PKCE), so Executor registers its own
  client and the user signs in to Zero in the browser and picks the workspace
  the connection may reach. Scopes: `mcp:tools`, `mcp:read`, `mcp:write`. If
  registration is refused, use the redirect URI shown on Executor's connect page.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: the REST API keys (Settings > Connections > API keys) are not
accepted by the MCP server, so key-only users cannot connect. Account health only
verifies the token reaches the MCP server.
