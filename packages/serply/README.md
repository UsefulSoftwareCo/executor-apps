# Serply

Serply is a search and scraping API. This package exposes its fourteen tools: Google Search, News, Video, Scholar, Jobs and Maps, Bing Search, Amazon product search, Reddit (subreddit posts and about, user posts, posts and comment trees) and a URL scraper that returns markdown or HTML.

Interface: Serply's official hosted MCP server, `https://api.serply.io/mcp` (docs: https://serply.io/mcp.md). Serply's REST OpenAPI document is only a generic proxy stub, so MCP gives the real tool set. Tools without `readOnlyHint` require approval.

Auth: API key only. Serply has no OAuth. Create a key at https://app.serply.io (new accounts get 2,500 free credits); it is sent in the `X-Api-Key` header. Each uncached successful call costs one credit.

Known gaps: the remaining REST endpoints (eBay search, Google Images) are not in the MCP server and are not exposed. Most tools return rendered markdown rather than JSON. The MCP server could not be listed without a key, so the tool count comes from the vendor docs.
