# Coinranking

Cryptocurrency market data from the [Coinranking API](https://developers.coinranking.com/api/documentation): coins, prices and price history, global stats, exchanges, DEXs, markets, futures, technical indicators, tags, reference currencies and search. All tools are read-only.

**Interface:** hand-written tools over the REST API at `https://api.coinranking.com/v2`. Coinranking publishes no OpenAPI document, so the endpoint list comes from its official documentation. Path ids (`uuid`, `slug`, ...) are top-level inputs; every other API parameter goes in the `query` object (arrays become `name[]=value`).

**Auth:** API key, sent as the `x-access-token` header. Create one in your Coinranking developer account at https://developers.coinranking.com/. Coinranking has no user-created OAuth apps.

**Known gaps:**
- Most endpoints beyond coins, stats, tags, reference currencies and search need the Professional plan or higher; the Free plan gets 403 (FORBIDDEN) errors for plan-gated endpoints and 429 (TOO_MANY_REQUESTS) when the quota is exceeded for them.
- Real-time endpoints (WebSocket, server-sent events, tickers, rates) and the icons CDN are not exposed.
- Query parameters are free-form, not individually typed; each tool's description lists them.

- The /bulk/coins endpoint (gzip stream of all coins, 25 requests/day) is not exposed because it takes no parameters and returns a compressed full dump.
- Coinranking publishes no OpenAPI document or MCP server (checked developers.coinranking.com docs), so tools are hand-written.
