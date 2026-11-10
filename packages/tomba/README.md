# Tomba

Find, verify and enrich B2B contact data with Tomba: domain search, email finder, author and LinkedIn finders, email verifier, phone finder and validator, person, company and combined enrichment, company search, technology and similar-domain lookups, leads, flags, API keys and usage.

## Interface

Tomba's official remote MCP server, `https://mcp.tomba.io/mcp` (28 tools, Streamable HTTP, stateless). Docs: https://docs.tomba.io/llm/remote-mcp/introduction. Tomba also has a REST API (`https://api.tomba.io/v1`), but publishes no downloadable OpenAPI document (its docs render the spec only as a web page), so the MCP server is the interface. Tools that are not marked read-only need approval.

## Auth

- API key and secret (`apiKey`): create a key and copy the account secret at https://app.tomba.io/api. Keys start `ta_`, the secret starts `ts_`. They are sent as the `X-Tomba-Key` and `X-Tomba-Secret` headers. Keys expire after at most 365 days.
- OAuth 2.0 (`oauth`): discovered from the MCP server's metadata (`https://api.tomba.io/.well-known/oauth-authorization-server`), with dynamic client registration and PKCE, so no OAuth app needs to be created. Scopes come from the server's metadata. Redirect URI: Executor's own `/api/oauth/callback`.

## Known gaps

- `usage_info` and `get_logs` call endpoints that reject OAuth tokens; use an API key and secret for them.
- Finder, verifier and enrichment calls spend Tomba credits. Bulk-job REST endpoints are not exposed by the MCP server.
