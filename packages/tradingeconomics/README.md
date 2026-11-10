# Trading Economics

Economic indicators, forecasts, the economic calendar, markets (currencies, commodities, stocks, bonds), financial news and more for 196 countries.

Interface: OpenAPI, the vendor's own document at https://api.tradingeconomics.com/swagger/v1/swagger.json (168 GET operations, all on `api.tradingeconomics.com`).

Auth: API client key. Create or view it in your account at https://tradingeconomics.com/analytics/api.aspx. Enter it as `key:secret` (the free `guest:guest` key works with sample data). It is sent as the `c` query parameter, as the spec declares; the health check uses the equivalent `Authorization: Client {key}` header. No OAuth.

Known gaps: the API is read-only, so no approvals are needed. Some endpoints require a paid plan. Streaming (websocket) is not covered.
