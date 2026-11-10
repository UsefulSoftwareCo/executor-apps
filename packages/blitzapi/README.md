# Blitz API

Blitz API is a B2B data service for go-to-market teams. This package covers its v2 API: people, company and job search, TAM counts, person/company enrichment, work email and phone lookup, reverse email/phone lookup, LinkedIn/domain conversion, employee distributions, account key info and the public changelog (21 tools).

Interface: OpenAPI, from the vendor's official v2 document at https://docs.blitz-api.ai/api-reference/v2.openapi.json (server https://api.blitz-api.ai). Blitz also runs a remote MCP server at https://api.blitz-api.ai/mcp, but it needs a Blitz account sign-in and the OpenAPI tools already cover every endpoint.

Auth: API key only. Create one at https://app.blitz-api.ai; it is sent in the `x-api-key` header. Blitz offers no user-created OAuth apps. The health check calls `GET /v2/account/key-info`.

Notes: most operations are POST searches or lookups and are marked as requiring approval, since they consume plan records. Free trial accounts have 1,000 credits.
