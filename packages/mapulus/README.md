# Mapulus

Covers the Mapulus API: maps and locations (list, get, create, update, delete) plus the data endpoints for boundaries, demographics, incidents, health and Meta targeting jobs.

Interface: OpenAPI, from Mapulus's own document at https://developer.mapulus.com/v1/openapi.json (docs at https://developer.mapulus.com). All operations go to `https://api.mapulus.com`.

Auth: API key only. Mapulus sends it as a bearer token (`Authorization: Bearer <key>`); create the key in your Mapulus account settings (see the developer docs). Mapulus offers no user-created OAuth apps. The health check lists maps.

Known gaps: the vector tile endpoint (`/v1/tiles/{layer}/{z}/{x}/{y}.pbf`) returns binary protobuf and is not useful as a tool.
