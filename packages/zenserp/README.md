# Zenserp

Real-time search results as JSON through [Zenserp](https://zenserp.com): Google, Bing and Yandex web search, reverse image search, Google Trends, Google Shopping product details, batch listing, quota status, and lookups for valid country, language, location and search-engine values.

**Interface:** custom tools written with `fetch` (12 tools) against `https://app.zenserp.com/api`. Zenserp publishes no OpenAPI document, MCP server or GraphQL API (the only GitHub presence found is its parent company's org, apilayer; the search for an official spec was not exhaustive). Request shapes were checked against the vendor's documentation page (https://app.zenserp.com/documentation), whose content is rendered client-side from its JavaScript bundle. Every path appears in the vendor docs; responses were not exercised against a live key. All tools are read-only.

**Parameters:** Bing and Yandex (and YouTube) are selected with the `search_engine` parameter (for example `bing.com`), as in the vendor docs; the `engine` parameter belongs only to the separate answer-engine endpoint. `num` accepts 1-100 per the docs (not enforced locally, the framework schema has no bounds). The trends tool follows the docs for `/api/v1/trends`, which returns currently trending searches (at most the past 7 days): `geo`, `cat`, `timeframe`, `hl`, `gl`, and an optional `keyword[]` filter with no documented limit.

**Auth:** API key, sent in the `apikey` request header (the vendor docs' curl examples use `-H "apikey: ..."`; a query parameter is also accepted). Copy it from the dashboard at https://app.zenserp.com after signing up. Zenserp has no OAuth.

**Known gaps:**
- Search has one tool per engine (Google, Bing, Yandex) plus reverse image search. Documented verticals that are not exposed: AI Overview (`ai_overview=1`, billed 3 requests), Image, Video, Maps, News and Shopping search (the `tbm` parameter), Google Hotels, Google Jobs, Google Flights, YouTube search (`search_engine=youtube.com`), DuckDuckGo, the answer-engine endpoint, and creating batches. Bing-specific parameters (`cc`, `mkt`) and Google `tbs`, `lat`/`lng`, `output` are also not exposed.
- Paid plan features (batches, AI Overview) return an error on plans without them.
- The health check calls `/v2/status`, a read-only endpoint; the docs do not say whether it consumes quota (the vendor says only successful search responses are billed).
- The icon is the wordmark from Zenserp's official site logo (`zenserp-logo-dark.svg`); the vendor publishes no separate symbol mark.
