# BuiltWith

Website technology profiling with BuiltWith: live and historical technology lookups for a domain, technology lists, relationships between sites, trends, company-to-URL, trust, keyword search, recommendations, redirects, VAT/company registration data, account usage and credit balance, an MCP registry search, vector/ask tools, and keyless MPP and x402 pay-per-call tools.

Interface: BuiltWith's official hosted remote MCP server, `https://api.builtwith.com/mcp` (51 tools as of 2026-10-12, serverInfo 2.1.0; the vendor's GitHub README at https://github.com/builtwith/mcp still lists 27, which is out of date). BuiltWith also publishes an OpenAPI 3.1 document at https://api.builtwith.com/openapi.json, but it covers only the x402 pay-per-call subset (14 paths under `/agent/*` and `/x402/list-pass/*`), not the API-key API, so MCP is the broader official interface and is what this package uses. The server lists its tools without credentials, but tool calls need a key or token.

## Auth

- API key: send your BuiltWith API key as a bearer token (`Authorization: Bearer <key>`, per the vendor's MCP README). Find it in your BuiltWith account under Account > API (https://api.builtwith.com/).
- OAuth: the server publishes RFC 8414 metadata at `https://api.builtwith.com/.well-known/oauth-authorization-server` (authorize `/authorize`, token `/token`, registration `/oauth/register`, PKCE S256, public client with `token_endpoint_auth_methods_supported: ["none"]`). Its protected-resource metadata lists scopes `api.read` and `api.write`. The package uses `oauth2({ discover })`, so endpoints and scopes come from that metadata. Add Executor's redirect URI if BuiltWith asks for one. Dynamic client registration was not exercised, to avoid creating vendor-side clients.
- This package does not use the classic REST API. The MCP server is the source of the bearer and OAuth facts here. `hosts` is `api.builtwith.com`, which covers the MCP, authorize, token and register endpoints.
- Health check: the server answers `initialize` and `tools/list` without credentials (even with a bogus bearer token), so `mcpHealth` cannot verify an account. The package instead makes a read-only, free `usage-api` call with the account's bearer token and fails when the result contains a non-empty `Errors` array (a bad key returns `API Key is incorrect`).

## Approvals

Every tool except those with `readOnlyHint: true` needs approval. Only `mpp-catalog` is marked read-only, so nearly all lookups ask for approval. Four tools spend real money and always need approval: `mpp-purchase`, `payment-purchase`, `x402-credit-purchase` and `x402-list-pass-purchase`.

## Known gaps

- The Live Feed WebSocket API and the bulk domain and datasets APIs are not exposed by the MCP server.
- Lookups consume BuiltWith API credits on your account.
