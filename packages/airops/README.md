# AirOps

AirOps brand context, knowledge bases, content workflows and Brand Kit editing
for AI Engine Optimization, exposed to agents.

Interface: AirOps' official remote MCP server (streamable HTTP),
`https://app.airops.com/mcp`, documented at
https://docs.airops.com/developers/mcp-server. Tools are whatever the server
lists for the account; listing needs credentials, so no
tool count is verified here. AirOps also has a bearer-token HTTP API at
`https://api.airops.com`, but publishes no OpenAPI document, so the MCP server
is the interface.

Auth:

- OAuth (`oauth`): the server publishes OAuth metadata (scope `api`, requested by the code) and a
  dynamic client registration endpoint (`/oauth/register`), so Executor registers
  its own client; no manual OAuth app is needed. The redirect URI is shown
  on the connect page.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: no API-key method for the MCP server. Account health only verifies
the token reaches the MCP server. The icon is the "ao" symbol, rebuilt as SVG
from the glyphs of AirOps' official logo on airops.com (the published symbol is
PNG only).
