# Alpha Vantage

Financial market data from Alpha Vantage: intraday to monthly stock time series,
quotes, fundamentals, earnings, forex, crypto, commodities, economic indicators,
news sentiment, options and technical indicators.

Interface: Alpha Vantage's official remote MCP server, `https://mcp.alphavantage.co/mcp`
(documented at https://mcp.alphavantage.co/). It lists 133 tools, all marked read-only.
No OpenAPI document was found for the REST API, so the MCP server is the interface.

Auth:

- OAuth (`oauth`), the only method: the server publishes OAuth metadata (scope
  `alphavantage:read`) with dynamic client registration, so Executor registers its own client
  and no manual OAuth app is needed. During sign-in the Alpha Vantage authorize page asks you to
  enter your Alpha Vantage API key; claim a free one at https://www.alphavantage.co/support/#api-key.
- There is no API-key method. The vendor documents no bearer-API-key route (a raw key sent as a
  bearer token is rejected on tool calls). Its only other route is the legacy `?apikey=` URL
  parameter, which the vendor marks deprecated and which cannot work with Executor's MCP health
  check, so it is not offered.

Approvals: every tool the server does not mark read-only asks for approval (none currently).

Known gaps: the sign-in flow and tool calls were not exercised with a real key or account.
Free keys are limited to 25 requests per day and some tools are premium-only. Alpha Vantage ships
only a raster logo (https://cdn.alphavantage.co/logo.png), so the icon is a hand-drawn SVG redraw
of that mark, with a lighter grey stroke in the dark variant.
