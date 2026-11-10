# Radar

Radar (radar.com, formerly radar.io) is location infrastructure: geocoding, address autocomplete, place and geofence search, routing, and geofence, trip, user, beacon and event management. This package covers all of it with 36 hand-written tools grouped as `geocoding`, `search`, `routing`, `users`, `trips`, `geofences`, `beacons`, `events` and `settings`.

**Interface:** custom. Radar publishes no official OpenAPI document and no remote MCP server, so the tools are hand-written against the REST API reference at https://docs.radar.com/api (base URL `https://api.radar.io/v1`). Mutations require approval.

**Auth:** API key (`apiKey`). Create keys in the Radar dashboard under Settings (https://dashboard.radar.com/settings). Radar sends the key bare in the `Authorization` header (no `Bearer` prefix). Use a secret key (`prj_live_sk_...` or `prj_test_sk_...`) to manage users, trips, geofences, beacons and settings, and to search users. A publishable key (`prj_live_pk_...`) is enough for geocoding, autocomplete, routing, place and geofence search, and track. Radar does not offer user-created OAuth apps.

**Known gaps:** Static Maps and map tiles (image/tile endpoints), the SDK-side configuration, and webhook delivery are not covered. Address validation (US and Canada) and conversion events (`events.logConversion`) are limited to Radar Enterprise plans. `routing.match` (POST /route/match) is declared as a query because Radar documents it as read-only. The "Get a trip" docs sample URL `/v1/trips/:id/route`, which is a typo in Radar's sample (the documented endpoint is `/v1/trips/:id`), so no route tool was added. IP geocoding reports the origin of the request, which is Executor's server.
