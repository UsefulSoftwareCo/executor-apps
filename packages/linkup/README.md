# Linkup

Web search API for AI: agentic search with sourced answers or structured output, page fetch (HTML or PDF to markdown), research agent, asynchronous batch tasks, extract (closed beta), rewind search/fetch and credit balance.

Interface: OpenAPI, Linkup's official document at https://api.linkup.so/v1/openapi.json (host `api.linkup.so`).

## Auth

- API key (`apiKey`): create one at https://app.linkup.so and paste it; it is sent as a Bearer token. No OAuth is offered by Linkup.

## Notes

- Linkup's search, fetch and research calls spend credits; every POST is approval-gated.
- The x402 pay-per-request mode is not supported; use an API key.
