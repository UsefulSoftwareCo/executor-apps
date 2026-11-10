# Finage

Real-time and historical market data from [Finage](https://finage.co.uk): stocks (US, UK, Canada, India, Russia), forex and metals, crypto, indices, ETFs, fundamentals, news and calendars. All tools are read-only.

**Interface:** hand-written tools over Finage's REST API at `https://api.finage.co.uk`, following the endpoints in the official docs (https://finage.co.uk/docs/api). Finage publishes no OpenAPI document, GraphQL schema or MCP server.

**Auth:** API key. Create one in the Finage dashboard (https://moon.finage.co.uk) and paste it when connecting. Finage takes the key as an `apikey` query parameter, which is how every call sends it. There is no OAuth.

**Verification:** every endpoint path, method and parameter was checked against the endpoint definitions embedded in the server-rendered docs page (https://finage.co.uk/docs/api), which list the request URL and input parameters for each endpoint. An invalid key returns HTTP 401, which fails the health check; a valid key returns the documented `market` and `timezone` fields from `/marketstatus`. Path values are percent-encoded one segment at a time.

**Known gaps:** websocket streaming feeds are not exposed. The docs page documents no CFD-specific, DEX or bulk-download endpoints beyond the "CFD Index" entries that reuse the index routes, so none are covered. Availability of each endpoint depends on the key's plan; free keys cap aggregate sizes. `/fnd/income-statement/{symbol.exchange_code}` is not separately exposed.
