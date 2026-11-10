# Geoapify

Geoapify location platform: forward and reverse geocoding, address autocomplete, batch geocoding and batch jobs, places, place details and place info, routing, route matrix, route planner, isolines, map matching, boundaries, postcodes, elevation, IP geolocation, geometry and geometry operations, map tiles and static maps.

**Interface:** OpenAPI. Each API is one of Geoapify's official OpenAPI 3.1 documents, published at https://github.com/geoapify/geoapify-openapi-specs (served from `https://apidocs.geoapify.com/assets/openapi/specs/`), mounted under its own router key in one app. 33 operations in total. Pure-read POST operations (route matrix, route planner, map matching, elevation, geometry operations, POST places and POST static map) run without approval; batch submission and geometry storage ask first.

**Auth:** API key. Create a project and key at https://myprojects.geoapify.com/. The key is sent in the documented `x-api-key` header.

**Gaps:** Geoapify also runs an official MCP endpoint (`https://api.geoapify.com/v1/mcp`, 11 tools); it is a subset of the REST APIs mounted here, so it is not mounted. The EU-only endpoint (`api-eu.geoapify.com`) is not used. Map tile, static map and marker operations return binary images.
