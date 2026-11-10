# EODHD APIs

Financial market data from EODHD: end-of-day, intraday and live prices, fundamentals, news, technical indicators, options, screener, marketplace and macro data. about 100 tools.

Interface: EODHD's official hosted MCP server (https://mcp.eodhd.com). EODHD publishes no OpenAPI document. The v1 server (which reports itself as `eodhd-datasets-legacy`) lists 100 tools (vendor docs say 72); the v2 set may differ. Mutations, if any, require approval.

Auth:
- API key (`apiKey`): uses the v1 server, `https://mcp.eodhd.com/v1/mcp`, which takes the key as an `apikey` query parameter. Find the key in your EODHD dashboard (https://eodhd.com/cp/settings). The key `demo` works for a few tickers such as AAPL.US. The v1 server lists tools without a key, so the account health check calls the REST endpoint `https://eodhd.com/api/user` to verify it.
- OAuth (`oauth`): uses the v2 server, `https://mcp.eodhd.com/v2/mcp`, with OAuth 2.1 discovery and the per-area `read:*` scopes (eod, intraday, live, fundamentals, news, technicals, options, marketplace, screener, macro, user) instead of `full-access`, since every listed tool is read-only. Coverage of every v2 tool by these scopes was not confirmed with a real grant. The redirect URI is registered automatically through dynamic client registration; no OAuth app has to be created. The server runs its own consent flow and the user logs in with their EODHD account. The health check for OAuth accounts is an MCP check against the v2 server.

Known gaps: the REST API's WebSocket streams are not covered. Tools available depend on the user's EODHD plan.
