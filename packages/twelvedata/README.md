# Twelve Data

Financial market data from [Twelve Data](https://twelvedata.com): time series, real-time quotes and prices, fundamentals, analyst data, 100+ technical indicators and reference data for stocks, forex, crypto, ETFs and funds.

## Interface

OpenAPI, from Twelve Data's official document at https://api.twelvedata.com/doc/swagger/openapi.json (about 187 operations). Mutating operations (the single POST, for batch requests) require approval. The WebSocket streaming API is not exposed.

## Auth

API key. Create one in the [Twelve Data dashboard](https://twelvedata.com/account/api-keys). It is sent as `Authorization: apikey <key>`. Twelve Data does not support OAuth. Some endpoints need a paid plan.

## Known gaps

No WebSocket price streaming. Plan-restricted endpoints return an error on free keys.
