# CoinMarketCap

Cryptocurrency market data from CoinMarketCap: listings, quotes (latest and historical), OHLCV, market pairs, trending, categories, exchanges, global metrics, fiat maps, price conversion, DEX tokens and pools, content and community data, plus key usage info.

## Interface

OpenAPI, from CoinMarketCap's official document linked in its API docs: https://coinmarketcap.com/api/documentation/openapi.json (110 operations, server `https://pro-api.coinmarketcap.com`). It is fetched at runtime.

## Auth

API key only (CoinMarketCap offers no OAuth). Create a key in the [CoinMarketCap developer portal](https://pro.coinmarketcap.com/account); the free Basic plan works. The key is sent in the `X-CMC_PRO_API_KEY` header. Health check calls `/v1/key/info`.

## Known gaps

Many endpoints require a paid plan and return a plan error on Basic keys. Credit usage is billed per call, so listing and historical calls can be costly. Operations using POST are approval-gated.
