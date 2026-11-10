# Databox

Databox analytics from an agent: accounts, data sources, datasets, metrics and data ingestion, exposed as whatever tools Databox's official remote MCP server offers.

**Interface:** Databox's official remote MCP server, `https://mcp.databox.com/mcp`. Databox publishes no OpenAPI document for its REST API (`api.databox.com`, documented at https://developers.databox.com), so the MCP server is the best official machine-readable surface. Tools that are not marked read-only require approval.

**Auth:** OAuth 2.0 only. The server publishes OAuth metadata with dynamic client registration (issuer `https://auth-api.databox.com/`, scopes `api:read` and `api:write`, PKCE S256), so Executor registers its own client and no OAuth app needs to be created by hand. The user signs in to Databox and approves access. The Databox REST API key (`x-api-key`) is not accepted by the MCP server and is not offered.

**Gaps:** The tool list is whatever the MCP server exposes, and it was not enumerated here because that needs a signed-in account. The legacy Push API (`push.databox.com`, Basic auth token) is not covered.
