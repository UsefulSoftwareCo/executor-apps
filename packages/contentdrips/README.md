# Contentdrips

Generate branded graphics and carousels from templates or with AI, render templates to PNG or PDF, and create, schedule and publish social posts through Contentdrips.

Interface: Contentdrips' official remote MCP server at `https://mcp.contentdrips.com/mcp` (documented at https://developer.contentdrips.com/mcp, 29 documented tools (11 read-only, 14 write, 4 destructive)). Contentdrips also has a REST render API (https://developer.contentdrips.com/) but publishes no OpenAPI document, and the MCP server covers it and more, so this package uses the MCP server only.

Auth:
- API token (`apiKey`): create one at https://app.contentdrips.com/api-management (Settings, API Tokens). Sent as a bearer token.
- OAuth (`oauth`): the server publishes OAuth metadata with dynamic client registration (authorization code with PKCE). Executor discovers it; the Contentdrips consent screen asks you to paste your API token. No OAuth app needs to be created.

OAuth scope: only `mcp` is requested. The authorization server also lists `offline_access` in `scopes_supported`, but the vendor docs describe OAuth only as a way to authorize your API key (the consent screen takes the pasted token), and say nothing about token expiry or refresh. The server supports the `refresh_token` grant, so refresh is not gated on `offline_access` in anything documented; it was left out to match the protected-resource metadata. If refresh problems appear, add `offline_access` to `scopes` in `index.ts`.

Tools that are not marked read-only by the server require approval, including publishing and deleting.

Known gaps: the tool list is read live from the server, so the tool count is not known without an account; it was not probed with credentials.
