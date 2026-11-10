# Crustdata

B2B company and people data from Crustdata: search, enrich and identify companies and people, job listings, live web search, social posts, asynchronous batch jobs, watches, and free account endpoints (credits, usage, permissions).

## Interface

OpenAPI, 62 operations, from Crustdata's official combined spec (version 2025-11-01):
https://static-assets.crustdata.com/openapi-specs/2025-11-01/crustdata.yaml
(the per-area API reference pages on docs.crustdata.com were not reachable as a downloadable spec, so the combined static spec is used). Base URL `https://api.crustdata.com`. 44 operations are mutations (38 POST, 3 PATCH, 3 DELETE) and need approval; 18 GET operations are reads.

## Auth

API key, sent as a Bearer token. Create it in the Crustdata dashboard (the "Get an API key" link on crustdata.com). Crustdata has no user-created OAuth apps for the REST API (its MCP server is not mounted here).

## Notes and gaps

- Every operation requires an `x-api-version` header; the package defaults it to `2025-11-01`, so callers need not pass it.
- Many endpoints spend credits and some live endpoints are enterprise-only; the health check uses the free `/account/credits`.
- Crustdata also runs an MCP server at https://install.crustdata.com/mcp . It also accepts `Authorization: Bearer <API key>` for programmatic use, but its tool list is not published. This package uses the official REST spec (62 operations); the team has not confirmed it is a superset of the MCP tools.
- Icon is Crustdata's official site app icon (192px PNG); no SVG mark is published.
