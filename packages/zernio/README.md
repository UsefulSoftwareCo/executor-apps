# Zernio

Zernio is a social media management API: scheduling posts, inbox conversations, analytics, ads, WhatsApp and more across 14+ platforms. This package covers the whole public API (964 tools, 550 of them mutations, all mutations require approval). The catalog target "Zernio MCP" is the same product; Zernio's hosted MCP server (`https://mcp.zernio.com/mcp`) wraps the same REST API, so it is not mounted separately.

## Interface

OpenAPI 3.1, Zernio's official document at <https://zernio.com/openapi.yaml>, loaded live. Server: `https://zernio.com/api`.

## Auth

- API key: create one in the Zernio dashboard (Settings, API keys). Sent as `Authorization: Bearer sk_...`.

## Known gaps

- Zernio also offers OAuth 2.1 with dynamic client registration, but it is documented for MCP clients only and the REST API's acceptance of those tokens is unconfirmed, so only API keys are offered.
- The spec is very large; first load of the tool catalog may be slow.
