# Pave

Covers the Pave External API for compensation planning: ping, merit cycles, a
cycle's exchange rates and a cycle's employees. The API is read-only today.

Interface: OpenAPI, Pave's official document published at
https://developers.pave.com/_bundle/apis/index.json (docs at
https://developers.pave.com/apis). Server: https://api.pave.com.

Auth: API key only (`x-api-key` header). An admin generates the key inside the
Pave app; the vendor offers no OAuth. The `/ping` endpoint is used as the health check.

Known gaps: Pave publishes only five operations, so that is everything exposed.
Pagination uses `nextCursor`.
