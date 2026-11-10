# Cardly

Send real, printed greeting cards through [Cardly](https://www.cardly.net): browse artwork, templates, fonts and writing styles, manage contacts and contact lists, preview and place orders, manage invitations and webhooks, and read the account balance and credit history. 48 tools (23 mutations, each requiring approval).

## Interface

OpenAPI 3.1, compiled live from Cardly's official v2 API document at
`https://api.card.ly/openapi/en-AU/2.2.0/json` (linked from the "OpenAPI Standard" section of https://api.card.ly/v2/docs). The URL is version-pinned (2.2.0); bump it in `openapi.ts` when Cardly publishes a newer version. All operations use the single origin `https://api.card.ly/v2`.

## Auth

- **API key** (`apiKey`): sent in the `API-Key` header. Create it in the Cardly business portal under Settings > API Keys. Each account has a `test_` key (validates requests, never mutates or bills) and a `live_` key (places real, billable orders). Cardly offers no OAuth for third-party apps.

The health check reads `/account/balance`.

## Known gaps

- Cardly's prose docs mention `text/json` as the content type while the OpenAPI document says `application/json`; the package rewrites the `application/json` content type the spec declares to `text/json` on outgoing requests, as the prose docs require. Not verified against a live key (no credentials were used); POST `/echo` with a `test_` key is the safe check.
- Not exercised against a real account.
