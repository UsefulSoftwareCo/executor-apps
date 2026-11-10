# Feathery

Forms, submissions, users, hidden fields, AI document extractions, document templates, team accounts and logs in Feathery, through Feathery's official remote MCP server.

Interface: MCP, `https://api.feathery.io/api/mcp/` (endpoint and regional hosts documented at https://docs.feathery.io/develop/mcp-server/connect-to-the-mcp-server, tool list at https://docs.feathery.io/develop/mcp-server/supported-tools). The vendor labels the MCP server Beta.. Feathery publishes no official OpenAPI document (its REST reference at https://api-docs.feathery.io has none), so MCP is the best official source. Regional workspaces (the vendor's connect page lists US, CA, EU, JP and AU) use `api-ca`, `api-eu`, `api-jp` and `api-au` hosts with the same path.

Auth: one method, an admin API key. In Feathery, copy the environment's admin API key (not the SDK key used to embed forms) and enter it with your region (`us`, `ca`, `eu`, `jp` or `au`). It is sent as `Authorization: Token <key>`. The key is environment-specific, so use a test-environment key when experimenting. The server offers no OAuth.

Approvals: every tool without a `readOnlyHint` asks for approval.

Known gaps: the MCP server is verified only to answer 401 without credentials; the supported-tools page lists 33 tools; the count was read from the docs, not measured against a live account.
