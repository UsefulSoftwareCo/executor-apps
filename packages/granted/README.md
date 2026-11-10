# Granted

Finds grant funding on Granted AI: search grant opportunities and funders, and read grant, funder and past-winner details including eligibility and deadlines.

Interface: Granted AI's official remote MCP server at `https://grantedai.com/api/mcp/mcp` (Streamable HTTP), listed on integrations.sh. The list is read live from the server and was enumerated: `search_grants`, `get_grant`, `search_funders`, `get_funder` and `get_past_winners`, all read-only. The list may change; any tool not marked read-only requires approval.

Auth: none. `scripts/mcp-probe.ts` reports the server as anonymous, so the package declares no account and needs no key or OAuth app.

Gaps: Granted also has a REST Data API at `https://grantedai.com/api/v1` that needs a bearer API key, but it publishes no OpenAPI document, so only the MCP server's tools are covered.

Icon: Granted's official sparkles mark, taken from the 256px favicon on grantedai.com (it publishes no SVG and Simple Icons has no entry).
