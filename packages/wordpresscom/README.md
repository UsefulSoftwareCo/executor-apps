# WordPress.com

Manage WordPress.com and Jetpack-connected sites: posts, pages, media, comments, taxonomy, stats and more, through WordPress.com's official remote MCP server.

Interface: MCP, `https://public-api.wordpress.com/wpcom/v2/mcp/v1` (docs: https://developer.wordpress.com/docs/api/). Tools are discovered at runtime. Every tool without `readOnlyHint` requires approval.

## Auth

- OAuth 2.1 with PKCE and dynamic client registration (metadata at `https://public-api.wordpress.com/.well-known/oauth-authorization-server`). The connection registers its own client; there is no user-created OAuth app, client ID or secret, and this package does not use the classic `developer.wordpress.com/apps` flow.
- Requested scope: `auth` only, as in WordPress.com's guide for custom MCP clients (https://developer.wordpress.com/docs/mcp/connect-custom-mcp-client/). The server's metadata also advertises `global` and 19 others; they are not requested, to follow least privilege. On the WordPress.com consent screen you choose Full access or Read only, which sets the account-level MCP tool settings. If tool calls are rejected for missing scope, widen `scopes` in `index.ts`.

## Known gaps

- Self-hosted WordPress sites are not covered (only WordPress.com and Jetpack-connected sites).
- The legacy REST API (`/rest/v1.1`) is not mounted; its OpenAPI description is not published officially.
- Not verified against a live account.
