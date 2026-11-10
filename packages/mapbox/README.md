# Mapbox

Mapbox geocoding and search, directions, matrix, isochrones, optimization, map matching, static maps and offline geospatial (Turf.js) calculations.

Interface: Mapbox's official hosted MCP server, https://mcp.mapbox.com/mcp (docs: https://docs.mapbox.com/api/guides/mcp-server/). Mapbox publishes no OpenAPI document. Tools are discovered live from the server; every tool without `readOnlyHint` requires approval.

Auth: two methods.
- OAuth (`oauth`): the server publishes OAuth metadata with dynamic client registration, so no OAuth app needs to be created. Requested scopes: `styles:tiles styles:read fonts:read datasets:read tokens:read`.
- Access token (`token`): create a Mapbox access token at https://account.mapbox.com/access-tokens/ and paste it. It is sent as `Authorization: Bearer <token>`, as documented in section 3.2 and section 4 of https://github.com/mapbox/mcp-server/blob/main/docs/hosted-mcp-guide.md. The token needs the scopes for the tools you use (for example `styles:tiles`, `styles:read`, `fonts:read`, `datasets:read`; public default tokens cover geocoding, directions and static images). This path is doc-based and has not been tested with a real token.

An earlier version of this README claimed the hosted endpoint does not support access-token header auth. That sentence was wrong.

Known gaps: the tool list (about 31 in the server's tool registry) is discovered live, so it is only visible after connecting an account.
