# Dropcontact

Find and verify B2B email addresses and enrich contacts and companies with Dropcontact.

Interface: Dropcontact's official remote MCP server, `https://mcp.dropcontact.com/mcp/` (documented at https://developer.dropcontact.com). Dropcontact publishes no OpenAPI document, so the MCP server is the widest official surface. Mutating tools require approval; tools annotated read-only do not.

Auth:

- API key: create it in your Dropcontact account (https://app.dropcontact.com, API section) and paste it. It is sent as a bearer token to the MCP server.
- OAuth: the server publishes OAuth metadata with dynamic client registration, so no OAuth app needs to be created. Add the redirect URI Executor shows if the server asks for it.

Known gaps: the tool list is whatever the hosted server exposes; the REST API (`api.dropcontact.com/v1`, `X-Access-Token` header) is not wrapped. Enrichment consumes Dropcontact credits. The MCP-key path is documented by Dropcontact but could not be exercised without credentials.
