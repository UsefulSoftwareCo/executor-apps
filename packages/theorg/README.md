# The Org

Company org charts, people and position search, managers and direct reports, open jobs, work-email resolution and lead lists in [The Org](https://theorg.com).

The Org publishes no OpenAPI document (its REST docs at https://developers.theorg.com/api are HTML only), so this package mounts The Org's official remote MCP server, `https://api.theorg.com/v1.1/mcp` (Streamable HTTP, 16 tools: company search and profile, org chart, executive positions, position reports, person lookup, jobs, manager, reports, position search, contact resolution, lists, usage). See https://developers.theorg.com/api/endpoints/mcp-api.

Auth, both supported by the server:

- **API key**: create one under Manage subscription > Developers on theorg.com. Sent as `X-Api-Key`.
- **OAuth**: authorization code with PKCE and dynamic client registration, discovered from the server's metadata (scope `mcp`). No OAuth app needs to be created. Add the redirect URI shown on Executor's connect page if prompted. An OAuth connection gets its own API key, so its credits and rate limits are tracked separately from a pasted key.

Tools that are not read-only (creating lists, adding to lists) require approval. Several tools spend credits (people search, contact resolution, org chart exploration); free accounts get 10 credits a month.

Known gaps: only what the MCP server exposes; the REST-only endpoints (bulk company search `POST /companies`, credit-usage estimates) are not included.
