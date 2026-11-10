# GoDaddy

Search, register and manage domains on GoDaddy: availability checks, registration and renewal, contacts, nameservers, DNS records, forwarding, agreements, plus domain search and AI name suggestions.

## Interface

OpenAPI plus MCP, all official GoDaddy sources:

- `v2`: https://developer.godaddy.com/openapi/domains-v2.json (30 tools)
- `v1`: https://developer.godaddy.com/openapi/domains-v1.json (23 tools)
- `mcp`: https://api.godaddy.com/v1/domains/mcp (public, no credentials; 2 tools for domain search and suggestions)

## Auth

A Personal Access Token (`apiKey`), sent as `Authorization: Bearer <token>` to `api.godaddy.com`. Create one in the GoDaddy developer dashboard (https://developer.godaddy.com). GoDaddy offers no OAuth for these APIs. The MCP server needs no credentials.

## Known gaps

- The v3 Domain Lifecycle API (https://developer.godaddy.com/openapi/domains-v3.json) is not mounted: the document is bundled with `#/x-ext` references that Executor's OpenAPI compiler cannot resolve, so it imports no operations.
- Health check lists domains (`GET /v1/domains?limit=1`), so a token without domain read access shows as unhealthy.
