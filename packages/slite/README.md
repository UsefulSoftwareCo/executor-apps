# Slite

Search, read, create, update, verify and delete notes in a Slite knowledge base, ask questions of it in natural language, and manage custom indexed content. Two interfaces are mounted side by side as separate accounts.

Interfaces:
- `api`: Slite's own OpenAPI document, https://api.slite.com/openapi.json (26 operations, server `https://api.slite.com/v1`).
- `mcp`: Slite's official remote MCP server, https://api.slite.com/mcp (about 42 tools, per https://slite.com/help/lmeen-YwXupV23/Slite-MCP). It adds what the REST API lacks: comment threads, channels, collections, block-level editing (append/modify/remove blocks, modify-range, update-table), move-note, restore-note, upload-file and the Slite agent. Tools are listed live from the server, so the count is not part of the compiled tool count.

Auth:
- REST API key (`api`): create it in Slite under organization menu > Settings > API > "Create a new key" (shown once). It is sent in the `x-slite-api-key` header, per https://developers.slite.com/docs/getting-started; the OpenAPI document labels the scheme "bearer", which the package overrides. The key grants access to all content the user can see.
- OAuth (`mcp`): the MCP server uses OAuth 2.0 authorization code with S256 PKCE; endpoints are discovered from https://api.slite.com/.well-known/oauth-protected-resource and https://slite.com/api/mcp/oauth. Slite supports dynamic client registration at https://slite.com/api/mcp/oauth/register, so no user-created OAuth app or client secret is needed. Redirect URI note: the redirect URI Executor shows on the connect page is registered automatically during dynamic registration; nothing to enter in Slite. Scopes: `mcp:read`, `mcp:write`, `offline_access`. Slite offers no OAuth for the REST API itself, only for the MCP server; its tokens go to `slite.com` (token and registration) and `api.slite.com`.

Known gaps: the header/bearer discrepancy for the REST API could not be confirmed against a live key (no credentials were used); the package follows the docs. The MCP was verified with the probe (401 with OAuth challenge) and deploy only, no live OAuth. Mutations (REST) and non-read-only MCP tools require approval.
