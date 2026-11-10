# World News API

Search and retrieve news from thousands of sources in 50+ languages: article search, top news clusters, retrieve by id, article and link extraction, news source lookup, newspaper front pages, website-to-RSS and geocoding. 9 read-only tools, so none need approval.

**Interface:** hand-written tools over `https://api.worldnewsapi.com`. World News API publishes no OpenAPI document. Its docs link to an MCP server, but that is a third-party npm package (`world-news-api-mcp`) from a personal GitHub account (`ddsky`), not published by the vendor, and it is local stdio only. The endpoints from https://worldnewsapi.com/docs/ are wrapped directly instead.

**Auth:** API key (`x-api-key` header, the method the vendor recommends). Create one in the console at https://worldnewsapi.com/console/ (free tier available). No OAuth is offered.

**Quota:** the API is points-based (the free plan has 50 daily points; a default request costs at least 1 point). The account health check calls `search-news-sources` once, only when an account is connected or re-checked; the vendor does not publish that endpoint's point cost. Responses are returned as raw JSON, and each tool call spends quota points on your plan.

**Known gaps:**
- `suggest-news-source` (POST, paid plans only, submits a source for review) is not wrapped: the vendor does not publish its parameter names, and it is a mutation that would need approval.
- Parameter names come from the vendor's per-endpoint docs. Live calls were not run (no real credentials were used). In particular the country filter on `search-news` is sent as `source-country` (some vendor summaries say `source-countries`), and the vendor docs do not name the `top-news` date parameter or its format, so `date` (YYYY-MM-DD) is used.
- `retrieve-front-page` parameters (`source-country`, `date`, `source-name`) come from the vendor page only, and the response is not decoded beyond JSON.
