# Marketstack

Stock market data from [Marketstack](https://marketstack.com) (an APILayer product): end-of-day, intraday and historical prices, tickers, exchanges, splits, dividends, indices, ETFs, bonds, commodities, currencies, timezones and SEC company data. All operations are read-only GETs.

## Interface

OpenAPI. The document is APILayer's official Marketstack v2 spec (OpenAPI 3.0.0, version 2.0.0, server `https://api.marketstack.com`), fetched live from SwaggerHub: https://api.swaggerhub.com/apis/apilayer-863/MarketstackAPIv2/2.0.0/swagger.json. The `apilayer-863` SwaggerHub owner is APILayer: it publishes the other APILayer APIs (Aviationstack, Coinlayer, Countrylayer, Currencylayer, ExchangeRate.host), and docs.apilayer.com is SwaggerHub-backed. The spec is hosted by the vendor, not by a third party.

## Auth

API access key only. Marketstack has no OAuth. Copy the key from the dashboard at https://marketstack.com/dashboard and paste it when connecting. The key is sent as the `access_key` query parameter, the only method the spec declares. The free plan allows HTTPS and EOD data; intraday, some intervals and extra endpoints need a paid plan. Health checks call `/v2/currencies?limit=1` and require a `data` array, so an error envelope fails; this spends one request from the monthly quota.

## Known gaps

None known. The spec has no mutations, so no approvals are configured. Endpoints were not called with credentials.
