# AccuWeather

Global weather data from AccuWeather: location search (autocomplete, city, postal code, coordinates, IP address, regions, countries), current conditions and history, daily and hourly forecasts, MinuteCast precipitation, alerts, lifestyle indices and tropical storms.

**Interface:** hand-written tools over AccuWeather's official REST API at `https://dataservice.accuweather.com` (docs: https://developer.accuweather.com). AccuWeather publishes no OpenAPI document, GraphQL API or MCP server, so each endpoint is a `fetch` tool. Most tools take a `locationKey`; find one with `locations.autocomplete`, `locations.search` or `locations.byGeoposition`.

**Auth:** API key. Create an app at https://developer.accuweather.com to get a key. The key is sent as `Authorization: Bearer <key>` to `dataservice.accuweather.com`, as described on https://developer.accuweather.com/documentation/authentication. AccuWeather has no OAuth.

**Notes:** every tool is read-only, so none require approval. Forecast ranges, indices and tropical endpoints depend on the API plan (tropical needs Prime or higher); calls outside the plan return an error. Endpoint paths were written from AccuWeather's documentation and not exercised against the live API (no real credentials were used). `tropical.stormForecast` uses the documented `.../{govId}/forecasts` path. `tropical.activeStorms`, `tropical.storms` and `indices.list` (`/indices/v1/daily`) come from AccuWeather's Enterprise (apidev) docs and older guides and are not confirmed on the developer portal. `indices.daily` uses the documented `/indices/v1/daily/{days}day/{locationKey}[/{indexId}]` form.

**Gaps:** Air Quality and Lightning are Enterprise-only, served from the Enterprise host (`api.accuweather.com`, key as query parameter) and are not included. Index group endpoints and the MinuteCast API's separate plans are also not covered beyond `forecasts.minuteCast`.
