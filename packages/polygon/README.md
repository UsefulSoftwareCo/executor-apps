# Polygon

Polygon.io, now branded Massive, market data for stocks, options, futures, indices, forex and crypto: aggregates, trades, quotes, snapshots, technical indicators, reference data, corporate actions, fundamentals, economic data and news. The API is read-only, so every operation is a query.

**Interface:** OpenAPI, loaded live from Massive's official document at https://api.massive.com/openapi. Requests go to `api.massive.com`; the legacy `api.polygon.io` host still responds but is not used.

**Auth:** API key. Create one in the Massive dashboard at https://massive.com/dashboard/keys. The document declares an `apiKey` query parameter; Massive also documents `Authorization: Bearer <key>`, so the package overrides the scheme to send the Bearer header and the key stays out of URLs and logs (the health check does the same). No OAuth.

**Icon:** Massive publishes no SVG or mark-only brand asset (massive.com serves only a 525x108 wordmark PNG and a 64px favicon), so the icon is the blue M mark from the official massive-com GitHub org avatar (460x460, converted from JPEG to PNG). Simple Icons' "polygon" is the unrelated Polygon blockchain logo and was not used.

**Known gaps:** the WebSocket streaming API and the S3 Flat Files endpoint are not REST and are not covered. Endpoints depend on the plan attached to the key; unentitled calls return a 403 from the API. Massive also runs a hosted MCP server at https://mcp.massive.com/ that is not mounted here since the REST document already covers the API.
