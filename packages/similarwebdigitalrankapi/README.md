# Similarweb Digital Rank API

Global website ranking data from Similarweb: the top-ranked sites worldwide, the global rank of a single domain over time, and the API key's remaining capabilities.

**Interface:** custom (hand-written tools). Similarweb publishes no OpenAPI document for this API, so the three tools wrap the documented endpoints at https://developers.similarweb.com/reference/top-similarrank-sites-all-traffic and https://developers.similarweb.com/reference/global-rank. The tools are `topSites`, `globalRank` and `capabilities`, all read-only.

**Auth:** API key. Create one in Similarweb under Settings, Account, API, "Generate a new API key". The key is sent as the `api_key` query parameter, as the API requires.

**Known gaps:**
- The broader Similarweb REST API v5 and Batch API need a paid plan and are not covered here; Similarweb also runs an OAuth-protected MCP server at https://mcp.similarweb.com for that platform.
- The Rank Tracking API is a separate product with its own key, so it is not covered here.
- The health check and `capabilities` tool use `/user-capabilities`, whose response shape is not documented publicly, so it is returned as is.
