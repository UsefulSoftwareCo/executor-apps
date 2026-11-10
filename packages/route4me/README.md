# Route4Me

Route optimization and last-mile delivery: optimizations, routes and their destinations, orders and custom fields, address book and groups, territories, avoidance zones, geocoding, tracking, activity feed, notes, members and configuration, and vehicles.

## Interface

Hand-written tools over the REST API at `https://api.route4me.com` (plus `https://wh.route4me.com/modules/api/v5.0/vehicles` for the vehicles module, which the docs' vehicle examples use). Route4Me publishes no OpenAPI document or official MCP server (the public docs at https://route4me.io/docs/ are the only reference, and the `route4me/route4me-api-docs` repository is not public), so each tool wraps an endpoint whose URL and HTTP method appear in the public docs' request examples (checked against the full docs page) and takes the endpoint's own parameter names in a `query` record and a JSON `body`. A `request` escape hatch reaches anything else, including telematics connections and route resequencing. All mutations require approval.

## Auth

API key only. Route4Me has no OAuth for user-created apps. Find the key in your Route4Me account under My Account > API. The key is sent as the `api_key` query parameter on every request, as the API requires.

## Known gaps

Not every documented endpoint has a dedicated tool; the rest go through `request`. Parameter shapes follow the docs and were not exercised against a live account. Notable operations without a dedicated tool: location heatmaps and clustered locations, duplicating routes, dispatching routes and previewing route assignment, setting a route rating, fetching route directions, creating orders from contacts, vehicle capacity profiles, telematics connections, and route resequencing. Batch geocoding with a multipart file upload is not covered either (the `geocode` tool takes addresses in the query string).
