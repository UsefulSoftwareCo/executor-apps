# Coinbase

Coinbase Advanced Trade: accounts, orders (create, edit, cancel, preview), fills, products, candles and market data, portfolios, conversions, payment methods and fee summaries, for a user's Coinbase account.

**Interface:** OpenAPI. Coinbase's official Advanced Trade document,
https://docs.cdp.coinbase.com/api-reference/advanced-trade-api/rest-api/advanced-trade-spec.yaml,
converted to JSON in `document.json` with the duplicate `text/event-stream` response variants
removed (a tool cannot return a stream). Calls go to `https://api.coinbase.com`.

**Auth:** OAuth 2.0 (Coinbase App OAuth2). Register an OAuth application at
https://portal.cdp.coinbase.com/oauth and set its redirect URI to the one Executor's connect page
shows. Enter the client ID and secret there. Authorization is at `login.coinbase.com/oauth2/auth`
(scopes comma separated, `offline_access` for a refresh token) and the token endpoint is
`login.coinbase.com/oauth2/token`. Requested scopes: `wallet:user:read`, `wallet:accounts:read`,
`wallet:buys:create`, `wallet:sells:create`, `wallet:user:update`, `wallet:trades:read`, `wallet:trades:create`, `wallet:transactions:read`,
`wallet:payment-methods:read`. `wallet:sells:create` is requested because the Coinbase App scopes page says sell-side orders via `POST /api/v3/brokerage/orders` need it (the Advanced Trade rest-scopes page lists only `wallet:buys:create`, so the vendor pages conflict; requesting both is safe). `wallet:user:update` covers portfolio create/edit and the CFM intraday margin setting. Every mutation (orders, conversions, portfolios) asks for approval.

## Known gaps

- Fund-movement operations are removed from `document.json` because they need `wallet:transactions:transfer`, which is deliberately not requested: `POST /portfolios/move_funds`, `POST` and `DELETE /cfm/sweeps` (schedule), and `POST /intx/allocate`.
- Coinbase's refresh tokens rotate on every refresh; the framework's oauth2 refresh behaviour was not verified.
- CDP API keys are not supported. They authenticate with a per-request ES256/Ed25519 signed JWT,
  which the key-and-secret credential form cannot produce. `GET /api/v3/brokerage/key_permissions`
  accepts only such keys, so it is skipped.
- The Coinbase App v2 endpoints (`/v2/accounts`, `/v2/transactions`, sends) and the Exchange, Prime,
  International and Onramp APIs are separate products with their own specs and are not included.
- The WebSocket feed is not exposed.
