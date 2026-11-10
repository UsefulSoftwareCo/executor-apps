# Felt

Covers the Felt collaborative mapping platform: maps, layers and layer groups, elements and element groups, projects, library, data sources and credentials, uploads, exports, image exports, comments and embed tokens.

Interface: Felt's official OpenAPI 3 document, https://felt.com/api/v2/openapi.json (API base `https://felt.com/api/v2`), loaded live, and Felt's official remote MCP server, https://felt.com/mcp. An account uses one or the other depending on how it signs in: API token accounts get the REST tools, OAuth accounts get the MCP tools (SQL over layers, spatial analysis, feature editing, map rendering, which Felt documents as available only through MCP or the Felt app).

Auth: two methods. (1) API token (`apiKey`), sent as a Bearer token for the REST API; create one in Felt under Workspace Settings, Developers tab. The REST API requires a Business or Enterprise plan and is included in the free trial. Felt documents no user-created OAuth apps for the REST API. (2) OAuth (`oauth`) for the MCP server: browser sign-in with dynamic client registration (no client to create, so no redirect URI to configure), scopes map.read, map.write, layer.read, layer.write, profile.read.

The icon is the "F" mark from Felt's official favicon (https://felt.com/favicon.svg); Felt publishes no other SVG logo.

Known gaps: file uploads use presigned S3 URLs on other hosts, which this package does not call; create the upload via the API, then send the file as a multipart upload with the `file` field to the presigned S3 parameters it returns; this package never contacts the S3 host.
