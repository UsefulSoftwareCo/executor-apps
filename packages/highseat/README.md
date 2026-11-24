# Highseat

Website traffic from Highseat, for agents: visitors, pages, sources, devices, locations, campaigns, events, goals, funnels and revenue, read through one report tool with periods, comparisons and filters. A connection that may write can also manage a site's notes, goals, funnels, saved reports and settings. Read-only tools (`readOnlyHint`) run without approval; every other tool asks.

## Interface

Highseat's official remote MCP server, `https://mcp.highseat.com/mcp` (probe verdict: `oauth`, [docs](https://highseat.com/docs/api/mcp)). Each tool call is a request to Highseat's public REST API with the same credential, so the API's site access, rate limits and error codes apply. The server lists 15 tools to a read credential and 24 to a write credential (9 saves and deletes). Highseat also publishes an OpenAPI document for that API, but the MCP server covers the same routes in fewer, smaller tools, so it is the one mounted.

## Auth

- **OAuth** (`oauth`): discovered from the server's protected-resource metadata (authorization server `https://app.highseat.com/api/auth`). Executor registers a public PKCE client through dynamic client registration; Highseat accepts any https redirect URI at registration, so `/api/oauth/callback` on your Executor origin works. When you connect, you sign in to Highseat and pick the workspace, the sites the connection may reach and whether it may make changes (owners and admins only). The token scope is `read` either way: the choice made on that page decides whether the connection writes. Access tokens last one hour and refresh with `offline_access`. Disconnect it in Highseat under Workspace settings > API keys.
- **API key** (`apiKey`): a workspace key from Workspace settings > API keys, limited to the sites the agent should reach. A read key lists only the tools that read; a write key adds the tools that change data. Sent as `Authorization: Bearer`.

Health check: `mcpHealth` (initialize and list tools with the account's credentials).

## Known gaps

- Tested end to end through Executor's generic MCP import (`apps.importCustom`) on a self-hosted Executor: automatic OAuth setup, dynamic registration with an https callback, sign-in, a live listing of 24 tools, live read calls and a token refresh after the one-hour expiry. This package itself was checked with `scripts/check.sh` but not deployed.
- Events cannot be sent: tracking goes through Highseat's script and server SDK, not the MCP server.

## Icon

Highseat's symbol, from its official brand exports.
