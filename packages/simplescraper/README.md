# Simplescraper

Scrape websites, create and manage scraping recipes and extract structured live web data (JSON, CSV, Markdown) with Simplescraper's no-code scraper.

Interface: Simplescraper's official remote MCP server, `https://mcp.simplescraper.io/mcp` (streamable HTTP), documented at https://simplescraper.io/docs/mcp-server. Every tool the server lists is exposed; tools without `readOnlyHint` require approval.

Auth: OAuth only. The server publishes RFC 9728 protected-resource and RFC 8414 authorization-server metadata (authorization code with PKCE S256, dynamic client registration at `https://mcp.simplescraper.io/register`, refresh tokens, scope `scrape`), so Executor uses `discover` and no OAuth app of your own is needed. If your organization restricts connectors, allow Executor's redirect URI shown on the connect page.

Not covered: Simplescraper's REST API (`https://api.simplescraper.io/v1`, API key from the dashboard). It publishes no OpenAPI document, so it is not exposed; the MCP server covers recipes and scraping. A live connect needs a real account and has not been verified.

Icon: the 512px app icon from simplescraper.io (`/img/icons/android-chrome-512x512.png`); Simplescraper is not in Simple Icons and publishes no SVG.
