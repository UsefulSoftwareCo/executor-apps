# ClickHouse

Manage ClickHouse Cloud through its control-plane API (organizations, services, API keys, members and invitations, backups, ClickPipes, private endpoints, usage cost and activity) and run read-only SQL and explore schemas through ClickHouse's official remote MCP server.

## Interface

Two official sources:

- OpenAPI: served by the API itself at https://api.clickhouse.cloud/v1 (OpenAPI 3.1). Every operation on https://api.clickhouse.cloud is a tool (172). Mutations require approval. Mounted under `api` for API key accounts.
- Remote MCP: https://mcp.clickhouse.cloud/mcp (https://clickhouse.com/docs/products/cloud/features/ai-ml/mcp/remote-mcp). Provides `run_select_query` (SELECT only), `list_databases`, `list_tables`, plus service, backup, ClickPipes and cost tools. Mounted under `sql` for API key accounts; OAuth accounts get only the MCP tools. Tools get approval unless annotated read-only. MCP must be enabled per service in the console (requires the `control-plane:service:manage-mcp` permission).

## Auth

- API key (key ID and key secret, HTTP Basic). Create one in the ClickHouse Cloud console under the "API Keys" tab in the left menu; see https://clickhouse.com/docs/cloud/manage/openapi. Each operation is gated by the key's permissions (the spec's `x-permission-scopes`), so grant the roles you need. The same key authenticates to the MCP server.
- OAuth 2.0 via dynamic client registration against the MCP server (`oauth2({ discover })`, scope list from the server metadata). It only reaches the MCP tools; the REST API offers no OAuth for third-party apps. The redirect URI is Executor's own callback.

## Gaps

OAuth accounts do not get the 172 REST tools. SQL is read-only (the MCP server only allows SELECT).
