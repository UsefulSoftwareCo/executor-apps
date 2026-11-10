# CoinMarketCal

Crypto event calendar: search upcoming and past events by coin, category, date range and keyword, read a single event, look up coin slugs and category ids.

**Interface:** hand-written tools over CoinMarketCal's official REST API v2, `https://api.coinmarketcal.com/v2` (docs: https://coinmarketcal.com/developer/docs). CoinMarketCal publishes no OpenAPI document that could be fetched (its docs and developer hosts sit behind a Cloudflare challenge), so the four read-only tools (`events.list`, `events.get`, `coins`, `categories`) were written from the published docs. Because no vendor spec was available to compare, response bodies are passed through unchanged.

**Auth:** API key, sent as the `x-api-key` header. Create it in the CoinMarketCal developer dashboard (https://coinmarketcal.com/developer). The CoinMarketCal API has no OAuth.

**Known gaps:** plan limits apply and are enforced by CoinMarketCal: the `categories` filter needs Standard or above, `impactMin` needs Elite or above, and the history/upcoming window depends on the plan. Expect 403 for filters your plan does not include. The legacy v1 API (`developers.coinmarketcal.com/v1`) is not covered. UNVERIFIED: the vendor's docs sit behind a Cloudflare challenge and could not be fetched, so the base URL, `x-api-key` header, paths and parameter names have NOT been checked against the docs or a live key; they come from search excerpts. Request/response bodies are passed through. The health check calls `GET /categories`. Cancellations and usage endpoints were removed because they could not be confirmed.
