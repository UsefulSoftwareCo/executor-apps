# SerpApi

Real-time structured search results from SerpApi: Google (web, images, news, maps, shopping, jobs, scholar, finance, trends, flights, hotels, events, autocomplete, Play, Lens, AI Mode, patents), Bing, DuckDuckGo, Yahoo, Yandex, Baidu, Naver, YouTube, Amazon, Walmart, eBay, Home Depot, Apple App Store, Yelp, Tripadvisor and more. It also exposes account usage, location lookup and the search archive.

**Interface:** hand-written tools over SerpApi's official REST API (`https://serpapi.com/search.json`, `/account.json`, `/locations.json`, `/searches`). SerpApi publishes no OpenAPI document. Its official remote MCP server (`https://mcp.serpapi.com/mcp`) exposes only a single `search` tool, so this package wraps the REST API directly: one tool per engine plus a generic `search` tool that accepts any engine id. Each engine tool takes `query` (mapped to that engine's main parameter, such as `q`, `k` or `search_query`) and a `params` object for everything else (`location`, `hl`, `gl`, `num`, `start`, ...). Engine parameters are documented at https://serpapi.com/search-api.

**Auth:** API key. Copy it from https://serpapi.com/manage-api-key. SerpApi has no OAuth. The key is sent as the `api_key` query parameter to `serpapi.com`.

**Notes:** every tool is read-only, so none require approval. Non-cached searches consume plan credits. Engines not given a dedicated tool are reachable through `search`.
