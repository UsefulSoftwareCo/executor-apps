# Piloterr

Web scraping and data extraction through [Piloterr](https://www.piloterr.com): search engines (Google, Bing, Brave), e-commerce product and search endpoints, LinkedIn, company data (Crunchbase, Glassdoor, Indeed), email finder and verification, website crawling and rendering, and account usage. Piloterr's llms.txt indexes about 235 API reference entries; the live MCP server listed 208 tools (see Known gaps).

## Interface

Piloterr's official remote MCP server, `https://mcp.piloterr.com/` (Streamable HTTP), documented at https://docs.piloterr.com/mcp. No public OpenAPI spec URL was found (the docs mention an OpenAPI reference, but common spec paths return 404), so MCP is the interface used. MCP tools run with approval unless the server marks them `readOnlyHint`. Calls are billed in Piloterr credits like the REST API.

## Auth

- **API key** (`apiKey`): sent in the `x-api-key` header. Create it in the dashboard at https://app.piloterr.com under API keys (see https://docs.piloterr.com/api-keys).
- **OAuth** (`oauth`): the server advertises OAuth with dynamic client registration (issuer `https://app.piloterr.com`, scope `piloterr`, PKCE S256), so no OAuth app needs to be created. Use the redirect URI Executor shows when connecting.

## Known gaps

The live `tools/list` returned 208 tools when queried with an invalid key (the list is served without valid credentials; 206 are not read-only, 2 are `readOnlyHint`). The 27-entry difference from the 235 reference entries in llms.txt is unexplained; some endpoints may not be exposed as tools. The count was not rechecked with a valid key. Health checks call `piloterr_usage` through `tools/call`, because the server lists tools for any key and only rejects invalid keys on a call. No REST OpenAPI fallback is mounted.

Both methods are offered on the vendor's authority.
