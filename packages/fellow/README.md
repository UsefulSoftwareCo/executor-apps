# Fellow

Meetings, AI summaries, transcripts, participants, action items, channels, and
meeting agendas and agenda templates in Fellow, the AI meeting assistant. The
vendor documents 20 tools for this server (12 read-only, 8 write); the count is
not verified live because the server requires OAuth to list tools.

Interface: Fellow's official remote MCP server, `https://fellow.app/mcp`
(https://developers.fellow.ai/reference/mcp-server). Tools are whatever the
server lists for the account. Fellow also has a REST Developer API
(`https://{subdomain}.fellow.app/api/v1`, header `X-API-KEY`) but it publishes no
OpenAPI document and per-workspace subdomains do not fit a mounted spec.

Auth:

- OAuth (`oauth`): the only method offered. The server publishes OAuth metadata
  and dynamic client registration (authorization code with PKCE), so Executor
  registers its own client and the user signs in with their Fellow account in the
  browser. Scopes: `read_meeting_content`, `read_action_items`, `read_channels`
  (meeting, action item and channel reads) and `write_meeting_agenda` (agenda and
  template writes). If registration is refused, use Executor's redirect URI shown
  on the connect page.
- Admin step: a Fellow workspace admin must first enable Workspace Settings >
  Security > "Allow users to create MCP connections". Some clients (Claude,
  ChatGPT) also need an admin to add Fellow as a connector before users can
  authenticate.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: Developer API keys are deliberately not offered. Fellow's MCP
documentation specifies OAuth only, and the MCP server rejects API keys, so a
`secrets` method would need a separate hand-written REST toolset against a
per-workspace subdomain; that is not built. Action items cannot be written
through the MCP server (vendor limitation). Account health only verifies the
token reaches the MCP server. Icon: Fellow's official SVG app icon
(cdn.fellow.app), light and dark colour variants.
