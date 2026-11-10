# Stormglass

Global weather and marine data from Stormglass (stormglass.io): forecast weather, historical weather since 2014, bio (ocean chemistry, soil), tides (extremes, hourly sea level, stations), astronomy, solar and elevation.

**Interface:** hand-written tools over Stormglass's official REST API v2 at `https://api.stormglass.io/v2` (docs: https://docs.stormglass.io). Stormglass publishes no OpenAPI document, GraphQL API or MCP server of its own; the only spec found is an old third-party conversion on APIs.guru covering one endpoint, which is not used. Tool paths and parameters were written from the official docs and not exercised against the live API (no credentials were used).

**Auth:** API key. Sign up at https://dashboard.stormglass.io and copy the key. It is sent as the raw value of the `Authorization` header to `api.stormglass.io` (no `Bearer` prefix). Stormglass has no OAuth.

**Notes:** every tool is read-only, so none require approval. Requests count against the plan's daily quota.

**Gaps:** the docs list each variable name per endpoint; `params` is a free-form comma-separated string, not an enum, so invalid names surface as API errors. Paid-only data (some sources, long ranges) depends on the plan.
