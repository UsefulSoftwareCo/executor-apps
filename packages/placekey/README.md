# Placekey

Placekey assigns a standard identifier (`What@Where`) to physical addresses and points of interest so location data can be matched across datasets. This package exposes `lookup` (one place) and `lookupBulk` (up to 100 places, one country per batch), with optional response fields such as `confidence_score`, `normalized_address`, `geocode`, `upi`, `parcel`, `geoid` and `gers`.

**Interface:** hand-written tools over Placekey's official REST API (`POST https://api.placekey.io/v1/placekey` and `/v1/placekeys`), documented at https://docs.placekey.io (index: https://docs.placekey.io/documentation/llms.txt). Placekey publishes no OpenAPI document and no remote MCP server, and the API has only these two endpoints. Both are POSTs because the body is JSON, but they only compute an identifier and change nothing, so they are exposed as queries with no approval prompt. Each spends plan lookups; a `geocode` field counts as an extra lookup.

**Auth:** API key only; Placekey has no OAuth. Create a key in the developer dashboard at https://dev.placekey.io. It is sent in the `apikey` header to `api.placekey.io` only. Rate limits apply across all of an account's keys (HTTP 429).

**Notes:** the health check makes one coordinates-only lookup (one plan lookup per check) because Placekey has no free account endpoint. Unmatched queries return HTTP 200 with an `error` field rather than an HTTP error.

**Known gaps:** the Python/JS client libraries' local Where-part computation is not replicated.

**Icon:** the map-pin mark cropped from the official logo SVG on https://docs.placekey.io (the logo is pin plus wordmark).
