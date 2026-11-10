# OpenWeather

Weather data from OpenWeather: current weather, 5 day and 16 day forecasts, One Call 3.0 (current, hourly, daily, alerts, historical timestamps, day summaries and overview), air pollution (current, forecast, history) and geocoding (direct, zip, reverse). 15 read-only tools (including multi-city current weather via group and find).

**Interface:** hand-written tools over OpenWeather's official REST API at `https://api.openweathermap.org` (docs: https://openweathermap.org/api). OpenWeather publishes no OpenAPI document or GraphQL API. Its site lists a remote MCP endpoint at `https://mcp.openweathermap.org/mcp`, but it is operated by a third party (The Bot Forum / Extreme Electronics Ltd), bills per credit with a `sign_up` tool, exposes a generic `fetch_data` tool, and per its page does not cover air pollution or geocoding. It is not the vendor's own first-party API, so each endpoint is a hand-written `fetch` tool against the official REST API instead.

**Auth:** API key. Create one at https://home.openweathermap.org/api_keys (per https://openweathermap.org/price the free plan covers current weather, 5 day forecast, air pollution and geocoding; the 16 day daily forecast needs the Startup plan or above; One Call 3.0 needs the "One Call by Call" subscription, which has a free daily allowance). The key is sent as the `appid` query parameter to `api.openweathermap.org`. OpenWeather has no OAuth. New keys can take up to a couple of hours to activate.

**Notes:** every tool is read-only, so none require approval. Paths and parameters were written from OpenWeather's documentation and not exercised against the live API (no real credentials were used).

**Lookup by name/id/zip:** OpenWeather has deprecated `q`, `id` and `zip` lookups on current and forecast endpoints (still working, no bug fixes). Tool descriptions steer to `lat`/`lon` via the geocoding tools.

**Gaps:** UV index (`/data/2.5/uvi`, `/uvi/forecast`, `/uvi/history`; legacy endpoints, vendor docs not retrievable to verify parameters), Stations (`/data/3.0/stations`) and Triggers (`/data/3.0/triggers`) APIs (plan-gated, write-oriented; would need approvals), paid-only products on other hosts (Hourly forecast 4 days, Climatic forecast 30 days, Historical bulk and statistical weather on `pro.openweathermap.org` / `history.openweathermap.org`), weather map tiles, Road Risk, Solar Irradiance and the Agro API are not included.
