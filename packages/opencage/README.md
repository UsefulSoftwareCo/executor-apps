# OpenCage

Forward and reverse geocoding with the OpenCage Geocoding API: addresses and place names to coordinates, and coordinates to addresses, as JSON, XML or GeoJSON, plus the connectivity check.

Interface: OpenAPI, from OpenCage's official document at https://opencagedata.com/openapi.yaml (also linked from integrations.sh as swagger.yaml). The document declares OpenAPI 3.2.0, which the Executor compiler rejects, so `openapi.ts` patches the version field to 3.1.0 (nothing else in it is 3.2-specific). It yields 4 read-only tools, all on `api.opencagedata.com`.

Auth: API key. Copy it from the OpenCage dashboard (https://opencagedata.com/dashboard#api-keys). It is sent as the `key` query parameter. OpenCage has no OAuth.

Known gaps: the API has only geocoding endpoints, so there are no account or usage tools. The `/ping` tool needs no key.
