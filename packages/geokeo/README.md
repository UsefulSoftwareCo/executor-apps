# Geokeo

Forward geocoding (address or place name to coordinates) and reverse geocoding (coordinates to address) with the Geokeo API. Tools: `geocode` and `reverseGeocode`.

**Interface:** hand-written tools over the documented REST API at `https://geokeo.com/geocode/v1/` (`search.php`, `reverse.php`). Geokeo publishes no OpenAPI document, MCP server or other endpoints. Source: https://geokeo.com/documentation.php

**Auth:** API key. Log in at https://geokeo.com, open the API tab of the dashboard and copy the key. It is sent as the `api` query parameter, the only method Geokeo documents. There is no OAuth.

**Known gaps:**
- Geokeo returns failures such as `ACCESS_DENIED`, `OVER_QUERY_LIMIT` and `ZERO_RESULTS` in the response body `status` field, so check `status` in tool results. The free plan allows 2,500 requests per day.
- The health check makes one reverse lookup, because Geokeo has no free account endpoint; it counts against the quota.
- `lat` and `lng` in results are strings, and viewport corners can appear swapped.
- Only JSON output is exposed.
