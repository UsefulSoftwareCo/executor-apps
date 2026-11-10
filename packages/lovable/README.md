# Lovable

Lovable projects, workspaces, agent messages (`send_message`, `get_message`,
`list_messages`), code (`list_files`, `read_file`, `get_diff`), database
(`query_database`), deployment, knowledge and skills, connectors and analytics.
The tool list is whatever the server exposes to the account.

Interface: Lovable's official remote MCP server, `https://mcp.lovable.dev`
(https://docs.lovable.dev/integrations/lovable-mcp-server). Lovable publishes no
public REST API or OpenAPI document, so the MCP server is the only interface.

Auth:

- OAuth (`oauth`): the only method; there is no API-key option. The server
  publishes OAuth metadata and dynamic client registration (authorization code
  with PKCE), and the user signs in with their Lovable account. Scopes:
  `offline`, `projects:read`, `projects:write`, `workspaces:read`,
  `workspaces:write`. Lovable states that hosted (non-localhost) clients need
  their redirect URI approved through Lovable support; give them Executor's
  redirect URI shown on the connect page if registration is refused. Enterprise
  workspaces must enable "Third-party MCP clients" under Workspace settings.

Approvals: every tool the server does not mark read-only asks for approval.
Note that `create_project` and `send_message` spend credits and
`query_database` has full read/write rights.

Known gaps: account health only verifies the token reaches the MCP server.
Icon: Lovable's official `icon.svg` from lovable.dev.
