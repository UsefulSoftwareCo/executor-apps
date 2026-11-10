# Workable

Run Workable recruiting and HR from an agent: jobs, candidates and pipeline stages, offers, requisitions, members, advanced search, employees, departments, legal entities, work schedules, time off, time tracking and performance reviews and cycles.

Interface: Workable's official remote MCP server at https://mcp.workable.com/mcp (Streamable HTTP), documented at https://workable.readme.io/reference/workable-mcp-server. Workable's documentation lists 94 tools; that count comes from the documentation and has not been verified against the live server. Every tool without `readOnlyHint` requires approval. Workable publishes no downloadable OpenAPI document for its REST API (SPI v3), so the MCP server is the interface. Every tool except `get_accounts` takes an `account` subdomain; call `get_accounts` first.

## Auth

- OAuth: the server supports dynamic client registration (RFC 7591) with PKCE S256 and advertises its metadata at https://mcp.workable.com/.well-known/oauth-authorization-server, so the app discovers and registers itself. No OAuth app needs to be created by hand, and the redirect URI is registered automatically. The 21 scopes come from the server's Bearer challenge and match its protected-resource metadata (`r_`/`w_` scopes for candidates, jobs, offers, requisitions, account, employees, time off, time tracking, reviews and reports). The discovered authorization and token endpoints are on `workable.com` rather than `mcp.workable.com`; the host-owned OAuth exchange is treated as outside the app's `hosts`, as in the GitHub package, so `hosts` lists only `mcp.workable.com`.
- API access tokens (Workable Settings > Integrations > API access tokens) are not offered: the MCP documentation states OAuth2 is the authentication method, and they work only against the REST API (an API key cannot authenticate to `mcp.workable.com`) (`https://<subdomain>.workable.com/spi/v3`).

## Gaps

- The 94-tool count is from Workable's documentation, not verified live: the unauthenticated probe returns a 401 challenge and cannot list tools.
- Unauthenticated probing only (`scripts/mcp-probe.ts` reports a 401 challenge and `verdict: oauth`); no real account was connected.
- Which tools set `readOnlyHint` cannot be confirmed without an authenticated session.
- Workable's REST-only endpoints without an MCP tool are not covered.
