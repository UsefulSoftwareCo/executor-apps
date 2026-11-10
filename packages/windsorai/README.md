# Windsor.ai

Query the marketing, advertising, analytics and CRM data sources connected to a Windsor.ai account, and use Windsor's supported write actions, through Windsor's official remote MCP server at `https://mcp.windsor.ai/` (docs: https://windsor.ai/documentation/windsor-mcp/). Tools are whatever the server exposes; non-read-only tools require approval.

## Auth

- API key (`secrets`): create it in Windsor.ai under the team settings "API Access" section. Sent as `Authorization: Bearer <key>`, as documented by Windsor.
- OAuth (`oauth2`): discovered from the server's metadata with dynamic client registration (scopes `create`, `delete`, `offline_access` as advertised). Allow the redirect URI Executor shows during connection.

## Gaps

Windsor also has a query-parameter REST API at `connectors.windsor.ai` with no published OpenAPI document; it is not wrapped here. The MCP server was probed only for its 401 OAuth challenge; tools were not listed without credentials.
