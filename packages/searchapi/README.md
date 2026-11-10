# SearchApi

Real-time structured JSON search results from [SearchApi.io](https://www.searchapi.io): Google (web, news, maps, shopping, flights, hotels, scholar, trends, AI mode), Bing, DuckDuckGo, YouTube, Amazon, Walmart, eBay, TikTok, Instagram, Airbnb, Zillow and more (about 150 engines), plus account usage, location lookup, search history and analytics.

**Interface:** hand-written tools over the documented HTTP API at `https://www.searchapi.io/api/v1` (https://www.searchapi.io/docs). SearchApi publishes no OpenAPI document. It also runs a remote MCP server at `https://www.searchapi.io/mcp` (OAuth, or a separate MCP token in an `X-MCP-Token` header from the SearchApi dashboard), documented at https://www.searchapi.io/integrations/mcp; it is not mounted here because it needs credentials different from the API key and could not be inspected without them. Each engine has its own tool taking a `params` object, and a generic `search` tool takes any engine id. Engine ids were taken from each engine's docs page.

**Auth:** API key, sent as a Bearer header. Copy it from https://www.searchapi.io/manage-api-key after signing up. SearchApi has no OAuth.

**Known gaps:** engine parameters are passed as a free-form `params` object rather than typed per engine. `searchAnalytics` needs a Scale plan or higher. `searchHistory.get` reads the public search link `/api/v1/public_search/{id}.json` (not exercised with a live key). Every tool is read-only; searches consume credits.
