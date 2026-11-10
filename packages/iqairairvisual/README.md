# IQAir AirVisual

Air quality and weather data from IQAir's AirVisual API: browse supported countries, states, cities and stations; get current air quality (AQI, main pollutant) and weather for a city or station by name, nearest by IP, or nearest by coordinates; and the global city ranking. 11 read-only tools.

**Interface:** hand-written tools over the official REST API at `https://api.airvisual.com/v2` (docs: https://api-docs.iqair.com, a Postman collection; its endpoint list was read directly from the published collection). IQAir publishes no OpenAPI document, GraphQL API or MCP server, so each documented endpoint is a `fetch` tool.

**Auth:** API key. Create one in the IQAir dashboard at https://www.iqair.com/dashboard/api (the free Community plan works with limited detail and rate limits). It is sent as the `key` query parameter (confirmed in the vendor docs). The docs describe no OAuth. Failures arrive in the JSON body as `status` other than `success` (`incorrect_api_key`, `api_key_expired`, `call_limit_reached`, ...); the health check requires `status` to be `success`.

**Notes:** every tool is read-only, so none need approval. Fields returned depend on the plan. Paths and parameters follow IQAir's published docs and were not exercised against the live API (no credentials used). The icon is the IQAir logo from Wikimedia Commons (the vendor's site blocks automated downloads).

**Gaps:** the vendor docs list no separate historical or forecast endpoints; on plans that include them, the `forecasts`, `forecasts_daily` and `history` objects are returned inside the `city` and `station` responses, so the existing tools expose them. The AirVisual device/Pro endpoints are not documented publicly and are not included. The IQAir logo is the only one found (a wordmark with the Swiss flag); no standalone mark was located.
