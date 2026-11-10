# ASIN Data API

Real-time Amazon product data from ASIN Data API (Traject Data): product details, seller offers, category listings and keyword search across Amazon marketplaces, plus the account's credit usage.

Interface: custom, hand-written tools over the Product Data API (`GET https://api.asindataapi.com/request?type=product|offers|search|category`) and the free `GET /account` endpoint, documented at https://docs.trajectdata.com/asindataapi/. ASIN Data API publishes no OpenAPI document, GraphQL API or MCP server.

Auth: API key only. Sign up at https://app.asindataapi.com/signup and copy the key from the dashboard. The vendor takes the key as the `api_key` query parameter on every request (no header auth); the tools add it for you. The service has no OAuth. The connection check calls `/account`, which costs no credits.

Tools: `product`, `offers`, `search`, `category` (each costs one credit per request, per page with `max_page`) `account` (free), and the read-only Collections tools `collections`, `collection`, `collectionRequests`, `resultSets`, `resultSet` (free).

Known gaps: only the read-only Collections endpoints are exposed (`collections`, `collection`, `collectionRequests`, `resultSets`, `resultSet`; using the Collections API is free, per https://docs.trajectdata.com/asindataapi/collections-api/overview.md). Creating, updating, deleting and starting Collections, request edits, destinations and webhooks are not exposed. Everything is read-only, so no tool needs approval. The common Product Data parameters (`include_fields`, `exclude_fields`, `output`, `csv_fields`, `include_html`) are not exposed.

Interface check: the vendor publishes no OpenAPI, GraphQL or MCP server that we found (https://docs.trajectdata.com/asindataapi/openapi.json is not a spec; llms.txt lists only REST pages). A search for an unpublished MCP server was not done.

Health check: `GET /account`. 401 (invalid key) maps to unauthorized; 402 (out of credits) and 429 are not auth failures. Only `account_info.email` is decoded, because the docs sample shows `name` but do not guarantee it.