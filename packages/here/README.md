# HERE

HERE Technologies location services: Geocoding and Search v7 (geocode, reverse geocode, autosuggest, autocomplete, browse, discover, lookup) and its Batch API, Routing v8, Isoline Routing, Matrix Routing, Public Transit and Intermodal Routing, Waypoints Sequence, Route Matching, Geofencing, Traffic v7, Destination Weather v3, Fuel Prices v3, EV Charge Points v3, Network Positioning v2 and Tour Planning v3. 114 tools in all, each API mounted under its own key.

## Interface

OpenAPI, from the official definitions HERE embeds in its developer documentation (https://docs.here.com, for example https://docs.here.com/geocoding-and-search/reference/get_geocode.md). HERE publishes one definition per operation page rather than one file per API, so the package bundles them merged per API (`*-openapi.json`, with the revision in each `info.version`). Geocoding and Search is cut into one document per endpoint because every endpoint has its own host. Public Transit's route operation is served from `transit.hereapi.com`, which HERE documents as serving all Public Transit services. Read-only POST operations (route calculation and import with a body, isolines, autosuggest, browse, discover, traffic with body parameters, weather alerts, fuel corridor search, route and geofence matching, network positioning, synchronous tour planning) run without an approval prompt. Everything that creates, changes or deletes data asks for approval: matrix creation (a calculation job), tour planning async/cancel/matrices, geofencing upload, modify and delete layers (which is a GET in HERE's API but is treated as a mutation), route matching overlay upload, and all Batch job and notification writes. 16 of the 114 tools are mutations. `packages/here/kinds-check.ts` fails when an approval override matches no operation.

## Authentication

API key only. Create a project and key in the HERE platform portal (https://platform.here.com/admin/apps, then Access Manager, API keys), enable the services you want, and paste the key. It is sent as the `apiKey` query parameter. The key must have the corresponding services enabled in its HERE project, otherwise those calls return 401 or 403.

## Known gaps

- HERE's OAuth is a signed OAuth 1.0a client-credentials exchange for a short-lived bearer token, not standard OAuth 2.0 authorization, so it is not offered.
- Not included: Map Image, Raster and Vector Tile APIs (binary tiles), the Tracking API (needs a separate Tracking login token), the restricted Signals endpoint, Data API, Parking, Safety Cameras and GNSS positioning APIs.
- The health check calls Geocoding (one billable geocode request per connect; HERE has no read-only account endpoint), so Geocoding and Search must be enabled for the key.
