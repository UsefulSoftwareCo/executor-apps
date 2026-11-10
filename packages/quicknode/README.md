# Quicknode

Quicknode blockchain infrastructure. One package covers the REST management APIs and the hosted MCP server, chosen by the auth method of the connected account.

## Interface

- **API key account:** Quicknode's three official OpenAPI documents, all on `https://api.quicknode.com`, mounted under their own keys.
  - `admin` (81 tools): endpoints, chains, security, rate limits, metrics, usage, billing, teams. Source: https://www.quicknode.com/api-docs/v0/swagger.json
  - `streams` (10 tools): https://api.quicknode.com/streams/rest/openapi.json
  - `webhooks` (10 tools): https://api.quicknode.com/webhooks/rest/openapi.json
- **OAuth account:** the official hosted MCP server at https://mcp.quicknode.com/mcp (live chain data plus endpoint, security, rate limit, log, usage and billing management; Viewer or Admin role decides what works).

Every REST mutation requires approval; MCP tools require approval unless marked read-only.

## Auth

- **API key (`apiKey`)**: create one in the Quicknode dashboard under Account > API Keys (https://dashboard.quicknode.com/api-keys). Sent as `x-api-key`.
- **OAuth (`oauth`)**: dynamic client registration against the MCP server, so no OAuth app needs to be created by hand. If prompted for a redirect URI, use the one Executor shows.

## Notes and gaps

- The Streams and Webhooks documents declare no servers; the origin is supplied in `openapi.ts`.
- The Admin document's Team operations reference an undeclared `bearerAuth` scheme. The package declares it as the `x-api-key` header, because the server reads the key only from that header (a live probe of a Bearer header returns 401 asking for `x-api-key`).
- Not included: the wallet-paid agent API (x402/MPP, https://quicknode.com/openapi.json), which needs a crypto wallet rather than an API key, and RPC endpoint calls themselves (each endpoint has its own URL and chain-specific methods; use the MCP server for live chain reads).
