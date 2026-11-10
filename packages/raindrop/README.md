# Raindrop.io

Search, save and organize Raindrop.io bookmarks, collections, tags and highlights.

**Interface:** Raindrop's official remote MCP server, `https://api.raindrop.io/rest/v2/ai/mcp` (Streamable HTTP, documented at https://developer.raindrop.io/mcp/mcp). Raindrop publishes no OpenAPI document, so the MCP server is the best official source. Tools are discovered live from the server; mutating tools require approval.

**Auth**

- OAuth 2.1 with PKCE, discovered from the server's metadata (https://api.raindrop.io/.well-known/oauth-authorization-server). Scopes `read` and `write`, resource `https://api.raindrop.io/rest/v2`, both taken from the vendor's protected-resource metadata. Raindrop's dynamic client registration only accepts pre-registered clients, so the user must create an app first: in Raindrop open Settings, Integrations (https://app.raindrop.io/settings/integrations), create an app, add the Executor redirect URI shown on the connect page as its redirect URL, then enter the app's Client ID and Client Secret on the connect page. Executor reuses the saved client afterwards.
- Access token (`secrets`): in Raindrop, open Settings, Integrations (https://app.raindrop.io/settings/integrations), create an app and copy its **Test token**. It does not expire.

**Known gaps**

- Raindrop's MCP server is in beta and requires a Raindrop Pro account.
- Not exercised against a live account: the OAuth flow (including whether the server accepts the `resource` parameter), the requested scopes, and the `mcpHealth` check are unverified.
- OAuth metadata is taken from Raindrop's own server at `api.raindrop.io`, which is used here.
- Tool list and count depend on the server; it cannot be listed without an account, so the catalog count is unverified.
