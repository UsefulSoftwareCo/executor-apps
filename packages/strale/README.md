# Strale

Strale is a marketplace of independently tested data, compliance and validation capabilities for AI agents. This package covers the API-key REST API: list capabilities and solutions, execute a capability or solution (`/v1/do`), natural-language suggestions, wallet balance and top-up, transactions, audit tokens and verification.

## Interface

OpenAPI, from Strale's own document at https://api.strale.io/openapi.json. Exposed are the Bearer-authenticated `/v1` operations (execute, web3 assurance, API key, wallet, transactions, audit tokens) and the public, no-credential read operations (`/v1/capabilities`, `/v1/capabilities/{slug}`, `/v1/solutions`, `/v1/solutions/{slug}`, `/v1/suggest`, `/v1/suggest/typeahead`, `/v1/verify/{transactionId}`). Removed: the `/x402/*` pay-per-call routes (paid with USDC, not an API key), `/health`, the A2A agent card, and the unauthenticated account-lifecycle routes `/v1/auth/register`, `/v1/auth/recover` and `/v1/auth/recover/confirm`, which act outside the connected account.

Strale also runs a remote MCP server at https://api.strale.io/mcp (9 tools) as an alternative; the OpenAPI covers more (wallet, transactions, audit).

## Auth

- API key: create an account at https://strale.dev (new accounts get EUR 2.00 free credit) and copy the `sk_live_` key. It is sent as a Bearer token to `api.strale.io`.

No OAuth.

## Known gaps

- Executing a capability spends wallet credit; every mutation requires approval.
- x402 USDC payment routes are not exposed.
