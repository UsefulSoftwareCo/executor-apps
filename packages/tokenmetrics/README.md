# Token Metrics

Crypto market data and AI analytics from Token Metrics: tokens, prices, daily and hourly OHLCV, TM, technology and fundamental grades (current and historical), daily and hourly trading signals, resistance and support, market metrics, quantmetrics, price predictions, moonshot tokens, correlation, AI reports, crypto investors, AI indices (list, holdings, performance) and the TMAI agent. 25 tools: 24 read-only GET tools plus `ask`, a POST to the TMAI agent that spends paid API credits and always requires approval.

## Interface

Hand-written tools over the REST API at `https://api.tokenmetrics.com/v3`. Token Metrics publishes no OpenAPI document and no official MCP server: its developer docs (https://developers.tokenmetrics.com/v3/docs) sit behind a Cloudflare challenge, and the only spec in circulation (APIs.guru) is a community conversion of an old v1 Postman collection with no security scheme, so it is not used. Endpoints, parameters and the auth header follow the current official TypeScript SDK, https://github.com/token-metrics/tmai-api-sdk-typescript (default branch, v3, last commit 2025-09-18), whose base URL is `https://api.tokenmetrics.com/v3` and which sends `x-api-key`. The older SDK https://github.com/token-metrics/tmai-api used `/v2` with an `api_key` header; it is superseded, and v3 removed the trader-grades, investor-grades, sentiment, scenario-analysis and sector/trader/investor index endpoints, so this package no longer exposes them. I could not call the live API from the authoring sandbox (host did not resolve, docs returned 403), so v3 is confirmed from the official SDK source rather than a live request.

## Auth

API key only. Create one at https://app.tokenmetrics.com/en/api. It is sent in the `x-api-key` request header. Token Metrics offers no OAuth for user-created apps. Every request uses `redirect: "error"`, so the key is never forwarded to another host.

The health check calls `top-market-cap-tokens?top_k=1` (read-only). Token Metrics has no current-user or account endpoint, so no account identity is reported.

## Approvals

`ask` is declared as a mutation and requires approval on every call because it consumes API credits. All other tools are read-only.

## Icon

The icon is the Token Metrics GitHub organisation avatar (PNG, embedded at 256px). The dark variant inverts the hues of the mark (the dark disc turns light and the yellow crescent turns blue); the mark stays fully visible on both backgrounds.

## Known gaps

- Endpoints are not described by a schema; inputs are the documented query parameters and results are returned as the API's JSON.
- The API limits date ranges to 29 days per call. The official SDK chunks long ranges only for indices-performance; these tools do not chunk or auto-paginate, so callers pass `start_date`/`end_date` within 29 days and use `page`/`limit` themselves.
- Endpoint availability and rate limits depend on the API plan.
