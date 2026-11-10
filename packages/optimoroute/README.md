# OptimoRoute

Route planning and dispatch for delivery and field-service teams: create, search and delete orders, start and monitor optimizations, read planned routes and dispatch status, send routes to drivers, update driver parameters and positions, and read or update order completion details.

## Interface

Hand-written tools over the official WS API v1 (https://optimoroute.com/api/, base URL `https://api.optimoroute.com/v1/`). OptimoRoute publishes no OpenAPI document and no MCP server. All 20 documented endpoints are exposed. Each tool takes a single `body` object with the fields listed in its description; GET endpoints send them as query parameters, POST endpoints as a JSON body. Every mutation (including start/stop planning and send routes) requires approval.

## Auth

API key only (the API has no OAuth). In OptimoRoute go to Administration > Settings > WS API and enable the API to get the key. It is sent as the `key` query parameter, as the API requires. The health check calls `get_dispatch_status`.

## Known gaps

- Inputs are an untyped `body` object, not per-field schemas.
- The API allows at most 5 concurrent requests per account; bulk calls are capped at 500 items.
- Icon is the official 512px app icon from optimoroute.com (no SVG published).
