# Mocean

Mocean's messaging and voice platform: send SMS, verify phone numbers with one-time codes (SMS or Telegram), look up carriers, check message status, balance and pricing, and place or end voice calls.

Interface: hand-written tools over the official REST API v2 (`https://rest.moceanapi.com/rest/2`, docs at https://moceanapi.com/docs/). Mocean publishes no OpenAPI document, and it has no official GraphQL API or remote MCP server. 13 tools; every billed or state-changing call requires approval.

## Auth

- API token (current method): in the Mocean dashboard open API Account and choose Generate Token. The token is shown once. It is sent as `Authorization: Bearer <token>`.
- API key and secret (legacy): the key and secret from the same dashboard page, sent as the `mocean-api-key` and `mocean-api-secret` request parameters.

Mocean has no OAuth. Credentials go only to `rest.moceanapi.com`. The health check calls the read-only balance endpoint.

## Known gaps

- Webhooks (delivery reports, inbound SMS and call events) are not tools; supply `dlrUrl` or `eventUrl` to receive them.
- Voice recording download (`/voice/rec`, binary mp3) is not exposed.
- Responses are requested as JSON; Mocean reports API errors through a `status` field, often with HTTP 200, so check it.
