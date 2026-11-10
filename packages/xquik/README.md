# Xquik

Xquik is a hosted platform for searching public X (Twitter) data, exporting results, publishing from connected X accounts, and running monitoring and giveaway workflows. This package exposes its REST API (about 150 paths under `/api/v1`) as tools.

## Interface

Official OpenAPI 3.1 document: https://xquik.com/openapi.json (API base `https://xquik.com/api/v1`). Xquik also hosts an MCP server at https://xquik.com/mcp; it is not mounted because the REST API covers the same product.

## Auth

- **API key** (`x-api-key` header): create one in the Xquik dashboard at https://xquik.com under API keys.

Xquik supports OAuth 2.1, but it is aimed at MCP clients with dynamic client registration, with no documented flow for user-created OAuth apps, so it is not offered here.

## Known gaps

The streaming endpoints (`/events/stream`) and the `cookieSession` security scheme are not usable from tools. Mutations require approval.
