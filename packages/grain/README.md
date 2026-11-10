# Grain

Meeting recordings, transcripts, notes, clips and workspace data in Grain, through Grain's official remote MCP server at `https://api.grain.com/_/mcp` (docs: https://developers.grain.com/mcp/overview.html).

Grain publishes no OpenAPI document for its REST Public API (https://developers.grain.com), so the MCP server is the interface. Tools are whatever the server lists; mutating tools require approval.

## Auth

OAuth 2.0 with PKCE (S256) and dynamic client registration, discovered from the server's metadata (`https://api.grain.com/.well-known/oauth-authorization-server`). No client needs to be created by hand. The redirect URI is the one shown on Executor's connect page; it is registered automatically.

Grain's personal access tokens (Settings > Integrations > API) work for the REST Public API only, which is not exposed here.

## Known gaps

The REST Public API (`/_/public-api`) is not covered. The MCP probe could not list tools without a signed-in account.
