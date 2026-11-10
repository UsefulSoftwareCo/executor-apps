# MrScraper

Web scraping in MrScraper: fetching pages with browser rendering and proxy
routing, AI extraction of fields, listings and sitemaps, Google SERP queries,
rerunning saved scrapers, and browsing stored results and quota.

Interface: MrScraper's official remote MCP server, `https://mcp.mrscraper.com/mcp`
(https://docs.mrscraper.com/docs/getting-started/mcp-server). It exposes seven
tools: `fetch`, `scrape`, `serp`, `status`, `rerun`, `results`, `result`.
MrScraper publishes no OpenAPI document, so the MCP server is used. The tool
list was probed only unauthenticated (it needs credentials), so the count is the
documented one.

Auth:

- API token (`token`): create one at https://app.mrscraper.com/api-tokens. Sent
  as `Authorization: Bearer <token>`.
- OAuth (`oauth`): the server publishes protected-resource metadata (authorization
  server `https://api.app.mrscraper.com`, PKCE S256, dynamic client registration,
  scopes `scrape:read`, `scrape:write`, `account:read`, plus `offline_access` for
  refresh tokens). The OAuth client is registered automatically through dynamic
  client registration with Executor's own callback URL, so you create no OAuth
  app and enter no redirect URI; just click connect and approve.

Approvals: every tool the server does not mark read-only asks for approval, and
`scrape` (saves scraper configs) and `rerun` (consumes quota) are forced to
require approval regardless of the server's hints, which are unverified.

Known gaps: the REST Scraper API endpoints the MCP server does not expose (scrape
to markdown, screenshots, bulk reruns, cancelling bulk results,
manual scraper healing, analytics, and the separate `x-api-token` REST
authentication, https://docs.mrscraper.com/docs/api/overview) are unavailable. Account
health only verifies the credentials reach the MCP server.
