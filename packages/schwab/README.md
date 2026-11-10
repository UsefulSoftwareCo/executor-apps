# Charles Schwab

Brokerage accounts and balances, positions, order history, order preview, placement, replacement and cancellation, transactions, user preferences, plus market data: quotes, option chains and expirations, price history, movers, market hours and instrument search.

**Interface:** hand-written tools over the Schwab Trader API (`https://api.schwabapi.com/trader/v1`) and Market Data API (`https://api.schwabapi.com/marketdata/v1`), documented at <https://developer.schwab.com>. Schwab publishes its OpenAPI specs only behind the developer-portal login, so there is no public document to compile. Order tools take a `body` object in Schwab's order format; see the Order Examples in the Trader API docs.

**Auth**
- OAuth only (Schwab has no API keys). Register an app at <https://developer.schwab.com> with the "Trader API - Individual" and "Market Data Production" products and set its callback URL to the Executor OAuth redirect URI exactly. Approval of the app by Schwab can take a few days. Enter the app key and secret as the OAuth client. Schwab defines no scopes. Access tokens last 30 minutes (refreshed automatically) and refresh tokens last 7 days, after which the account must be reconnected.

Health check calls `GET /trader/v1/accounts/accountNumbers`.

**Known gaps:** the streaming (WebSocket) API is not exposed. Every account endpoint needs the encrypted `hashValue` from `accounts.numbers`, not the plain account number.
