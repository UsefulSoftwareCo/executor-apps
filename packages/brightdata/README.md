# Bright Data

Web access for agents through Bright Data: search engine results, page
scraping behind anti-bot systems (Web Unlocker), a remote scraping browser and
structured data from Bright Data's pre-built scrapers.

Interface: Bright Data's official hosted remote MCP server (streamable HTTP),
`https://mcp.brightdata.com/mcp`, documented at
https://github.com/brightdata/brightdata-mcp and
https://docs.brightdata.com/ai/mcp-server/overview. Bright Data publishes no
OpenAPI document for its REST API (`https://api.brightdata.com`), so the MCP
server is the interface. Listing tools needs credentials, so no tool count is
verified here. The vendor's README states 32 tools for the hosted server: a base
set (search engine, scrape as markdown, batch and discover tools) is always on, and
the rest sit behind `groups=` (`scrapers`, `browser`, `geo`, `advanced_scraping`) on
the MCP URL; which are exposed to an OAuth connection is up to the server.
Auth:

- OAuth (`oauth`): the server publishes protected-resource metadata (scope `mcp`)
  and the authorization server at `https://brightdata.com` supports dynamic client
  registration with PKCE, so Executor registers its own client; no manual OAuth app
  is needed. The authorization server metadata lists
  `token_endpoint_auth_methods_supported: ["none"]`, so the package sets
  `tokenEndpointAuthMethod: "none"` explicitly (public PKCE client) instead of relying
  on the discovery default. The redirect URI is shown on the connect page.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: no API-key method. Bright Data's docs show an API token only as a `?token=`
query parameter on the MCP URL (the README never documents an `Authorization: Bearer`
header, and no real token was available to test one). `mcpRouter` and `mcpHealth` accept a
fixed `url` plus `headers`, with no query-placement option. Putting the token in the URL
would also make `mcpHealth` fail: it requires the unauthenticated attempt, which reuses the
same `url`, to be refused, but a URL carrying the token is authenticated. So only OAuth is
offered. Account health only verifies the token reaches the MCP server. The icon is the
32x32 `favicon.svg` from Bright Data's documentation site (vector, blue tile with white
mark); it is the only SVG mark Bright Data publishes (no brand kit or press page exists).
