# Polymarket US

Polymarket US is the CFTC-regulated prediction market for United States users (not the global Polymarket app). This package covers market data (events, markets, order book and BBO, settlement, search, series, tags, sports, price history, asset prices) and, with an API key, orders, portfolio and balances, RFQs, combos and incentives: 53 tools.

## Interface

OpenAPI. Polymarket publishes one official document per area at `https://docs.polymarket.us/api-reference/oapi-schemas/<area>-schema.json` (events, markets, search, series, tags, sports, price-history, asset-prices, orders, portfolio, rfqs, combos, incentives). `openapi.ts` mounts each under its own key in one router. Market data is served from `gateway.polymarket.us` (public); trading and account endpoints from `api.polymarket.us`.

## Auth

API key only (`apiKey`): a Key ID and a Secret Key. Create them at https://polymarket.us/developer after verifying your identity in the Polymarket US iOS app, signing in with the same login method as the app. The secret is shown once.

Requests to `api.polymarket.us` are signed per request: `X-PM-Access-Key` (Key ID), `X-PM-Timestamp` (Unix ms) and `X-PM-Signature`, the base64 Ed25519 signature of `timestamp + METHOD + path` using the first 32 bytes of the base64-decoded Secret Key (query string not signed). `index.ts` does the signing with a wrapped `fetch`; the clock must be within 30 seconds of Polymarket's. There is no OAuth.

## Known gaps

- The institutional REST/gRPC/FIX APIs, WebSocket streams, `sports-legacy` and partner onboarding endpoints are not included.
- The health check reads `/v1/account/balances`.
- Every mutation (placing, modifying, cancelling orders, RFQs, combos) requires approval. `previewOrder` runs without it.
