# Airtable

Bases, tables, fields, records and comments in Airtable: listing bases and
schemas, searching, creating, updating records, and managing fields and tables.

Interface: Airtable's official remote MCP server, `https://mcp.airtable.com/mcp`
(https://airtable.com/developers/agents/mcp/getting-started). Airtable publishes no
official OpenAPI document for its REST API, so the MCP server (which covers the
same operations) is used. Tools are whatever the server lists for the account; the tool list
was not enumerated (it needs credentials), so no tool count is recorded.

Auth:

- Personal access token (`token`): create one at https://airtable.com/create/tokens
  with the scopes you need (`data.records:read/write`, `schema.bases:read/write`,
  `data.recordComments:read/write`, `workspacesAndBases:read`) and grant it
  access to the bases you want. Sent as a bearer token.
- OAuth (`oauth`): the server publishes OAuth metadata and dynamic client
  registration, so Executor registers its own client. If registration is
  refused, create an OAuth integration at https://airtable.com/create/oauth and
  use Executor's redirect URI shown on the connect page as its redirect URL.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: webhooks and enterprise admin endpoints are not exposed by the MCP
server. Account health only verifies the token reaches the MCP server.
