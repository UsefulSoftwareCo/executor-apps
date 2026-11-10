# Skyfire

Skyfire is the identity and payments layer for AI agents. This package exposes 31 tools: creating, charging, introspecting and listing charges on KYA, pay and kya-pay tokens; the agent's wallet balance and source IPs; seller service management; the public service directory; and organization admin (users, seller agents, agent API keys).

## Interface

Hand-written tools over the official REST API at `https://api.skyfire.xyz`. Skyfire publishes no single OpenAPI document: each page of the [API reference](https://docs.skyfire.xyz/llms.txt) embeds its own definition, so the endpoints and fields here were taken from those pages. Skyfire also runs an MCP server at `https://mcp.skyfire.xyz/mcp`, but it only covers seller discovery and token creation, so it was not used.

## Auth

API key only (Skyfire has no OAuth for its API). Every request sends the `skyfire-api-key` header. Which key you use decides which tools work:

- Buyer agent key: `tokens.create`, `tokens.introspect`, `tokens.charges`, `agent.*`.
- Seller agent key: `tokens.charge`, `sellerServices.*`, plus introspect and charges.
- Organization admin user key: `organization.*`.

Create keys in the dashboard at https://app.skyfire.xyz (see [API Authentication](https://docs.skyfire.xyz/reference/api-authentication.md)). Skyfire itself needs no key for the directory tools, but they sit behind the account gate in Executor, so connect at least one account to browse the directory. Connect one account per key role.

The account health check tries the agent wallet balance endpoint and, if that rejects the key (as it does for organization admin keys), falls back to listing one organization user; either success passes.

## Known gaps

- Production only; the sandbox (`api-sandbox`) base URL is not offered.
- `tokens.create` and `tokens.charge` move real funds and always require approval, like every mutation.
- Using a key of the wrong role returns an error from Skyfire; the health check passes if the key is valid for either an agent or an organization.
