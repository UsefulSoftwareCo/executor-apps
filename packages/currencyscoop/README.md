# CurrencyScoop

Foreign-exchange and crypto rates from CurrencyBeacon (the service formerly called CurrencyScoop): latest rates, historical rates for a date, time series, currency conversion, the list of supported currencies and account usage.

**Interface:** CurrencyBeacon's official remote MCP server, `https://api.currencybeacon.com/mcp` (docs: https://currencybeacon.com/mcp). It exposes six tools (`get_latest_rates`, `convert_currency`, `get_historical_rates`, `get_time_series`, `list_currencies`, `get_account_usage`), one more than the five-endpoint REST API at https://currencybeacon.com/api-documentation, which has no published OpenAPI document. Each MCP tool call counts as one request against your plan quota.

**Auth:** API key. Create one in the CurrencyBeacon dashboard (https://currencybeacon.com, sign up for free). It is sent as `Authorization: Bearer <key>`. No OAuth.

**Known gaps:** time series needs a Startup or Professional plan. Crypto-specific endpoints are not part of the documented MCP tools.
