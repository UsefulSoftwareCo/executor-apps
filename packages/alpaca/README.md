# Alpaca

Trade US stocks, options and crypto and read market data through Alpaca: account and configuration, orders, positions, assets, watchlists, calendar, corporate actions, historical bars, quotes, trades, snapshots, news and screeners. 100 tools: 57 under `trading.*` and 43 under `marketData.*`.

## Interface

Two official OpenAPI documents published by Alpaca, fetched live:

- Trading API: https://docs.alpaca.markets/us/openapi/trading-api.json (origin `paper-api.alpaca.markets` or `api.alpaca.markets`, chosen by the connected account)
- Market Data API: https://docs.alpaca.markets/us/openapi/market-data-api.json (origin `data.alpaca.markets`)

The Broker API (for businesses building brokerages, with its own Basic-auth credentials) is not included. Alpaca's remote MCP server (`https://mcp.alpaca.markets/mcp`) was probed and is anonymous; the OpenAPI documents expose more working tools, so it is not used.

Alpaca's documents declare only the key-pair headers, so the package patches in an HTTP bearer alternative on every operation so OAuth tokens work.

## Auth

Four methods; pick the one that matches the account you mean to use. Paper and live accounts are separate hosts, so a paper connection can never reach live trading.

- **Paper trading API keys** and **Live trading API keys**: a key ID and secret key, sent as `APCA-API-KEY-ID` and `APCA-API-SECRET-KEY`. Generate them in the Alpaca dashboard (https://app.alpaca.markets) under the paper or live account's API Keys panel.
- **Paper OAuth** and **Live OAuth**: Alpaca's "Connect" OAuth2 flow (https://docs.alpaca.markets/us/docs/using-oauth2-and-trading-api). Authorization is `https://app.alpaca.markets/oauth/authorize` and tokens come from `https://api.alpaca.markets/oauth/token`, with scopes `account:write trading data`. Register an OAuth app with Alpaca to get a client ID and secret, and add the redirect URI Executor's connect page shows. The docs do not state token expiry; no refresh token is issued. Tokens are sent as `Authorization: Bearer`.

Every mutation (placing, replacing or cancelling orders, closing positions, editing watchlists and account configuration) asks for approval.

## Known gaps

- Broker API not covered.
- REST bearer access to market data is unconfirmed: Alpaca's OAuth docs show bearer calls only against the Trading API hosts and confirm OAuth for the market data stream; the `data` scope is listed as "Access to the Data API" without a REST example. The OAuth `marketData.*` tools send `Authorization: Bearer` to `data.alpaca.markets` on that assumption and may be rejected; API keys are the confirmed route.
- SSE event streams (for example corporate-action events) are not tools.
- Streaming (WebSocket) endpoints for trade updates and market data are not tools.
- Market data entitlements follow the account: free plans get IEX-only and delayed SIP data.
