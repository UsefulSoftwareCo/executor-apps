# Google Maps

Google Maps Platform in one package, 34 tools across ten mounted APIs: `places` (text, nearby and autocomplete search, place details, photo media), `geocoding` (geocode and reverse geocode, elevation, time zone), `routes` (compute routes and route matrices), `addressValidation` (validate postal addresses, send feedback), `weather` (current, hourly, daily, minutely, history, alerts, map tiles), `airQuality`, `pollen`, `solar` (building insights, data layers), `roads` (snap to roads, nearest roads, speed limits, traffic speeds) and `geolocation` (locate a device from cell and Wi-Fi data).

## Interface

OpenAPI, one document per Google API because each is served from its own host.

- Places API (New) v1, Address Validation v1, Solar v1, Air Quality v1, Pollen v1, Weather v1 and Roads v1 are generated from Google's official Discovery documents (`https://<service>.googleapis.com/$discovery/rest?version=<v>`, revisions 20261006 to 20261007). Google publishes Discovery documents, not OpenAPI, so `discovery-to-openapi.mjs` converts each to a vendored `<name>-openapi.json` (run as `node discovery-to-openapi.mjs disc.json > name-openapi.json`). Methods with `{+name}` paths use Google's flat paths, so a place is addressed by `placesId`. The Roads document lists each method twice (GET and a POST override); only the GET form is kept.
- Geocoding, Elevation, Time Zone, Routes (v2) and Geolocation have no usable public description (the Routes v2 and Geocoding v4beta Discovery documents exist at `https://routes.googleapis.com/$discovery/rest?version=v2` and `https://geocode.googleapis.com/$discovery/rest?version=v4beta` but are gated behind an API key and answer 403 to anonymous callers, so they are not vendored), so `legacy.ts` hand-writes them from the Maps Platform documentation. Request and response bodies are loosely typed objects; the field-by-field shapes are in Google's docs.
- Search, autocomplete, Routes, Address Validation validate, Air Quality lookups and Geolocation are POST operations that only read, so they are marked as queries and run without approval. `provideValidationFeedback` is the only mutation and needs approval.

Google also runs an official remote MCP server (Maps Grounding Lite, `https://mapstools.googleapis.com/mcp`) with five tools (`search_places`, `lookup_weather`, `compute_routes`, `resolve_names`, `resolve_maps_urls`), so the REST APIs are used instead.

## Auth

Maps Platform API key only. Create it in Google Cloud Console under APIs & Services, Credentials, on a project with billing enabled, then enable each API you want to call (Places API (New), Geocoding API, Routes API, and so on) and, if you restrict the key, allow those APIs. The key is sent as the `key` query parameter to every host. The connection check calls the Geocoding API, so that API must be enabled for the key; Maps web services answer HTTP 200 with a `status` field, and the check reads it. The key goes in the `key` query parameter; Google's Places (New) docs only document the `X-Goog-Api-Key` header, so the key can appear in URLs and logs. OAuth is not offered: the legacy web services (Geocoding, Elevation, Time Zone, Geolocation, Roads) reject OAuth tokens, and the newer APIs (Places (New), Routes, Address Validation) accept bearer tokens with the `cloud-platform` scope and an `X-Goog-User-Project` header but Google documents that path for server-to-server use with service-account style tokens, so there is no self-serve consent flow to offer.
## Known gaps

- No OAuth, no service account auth.
- Legacy Directions, Distance Matrix, Places (legacy), Static Maps, Street View and Maps Tile are not included; Routes and Places (New) replace the first two, and the image and tile APIs return binary data. Google's own `geoTiff`, `heatmapTiles`, `mapTiles` and `trafficSpeeds/tile` tools are present but return binary or tile payloads that are of little use as JSON.
- Geocoding v4, Map Datasets and Route Optimization are not included (their Discovery documents are gated behind an API key).
- Six of the 34 tools return binary payloads and are of little use as JSON: `solar.geoTiffGet`, the Air Quality and Pollen heatmap tile lookups, the Weather map tile lookup, the Roads traffic speed tile, and `places.placesPhotosGetMedia` (image bytes unless `skipHttpRedirect` is set). About 28 tools are useful as JSON.
- Routes, Places text search, Places nearby search and Place Details require a field mask. Each tool exposes `X-Goog-FieldMask` as a required header parameter (added to the Places document by patches in `openapi.ts`, since the Discovery converter drops Google's global `fields` parameter). Autocomplete does not need one.
