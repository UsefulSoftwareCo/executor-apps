# Fidel API

Fidel's Select Transactions API for card-linked loyalty and rewards: brands, programs, locations, cards, offers, transactions, webhooks, MIDs, MID requests, marketplace offers, missing transaction requests and MID insights (55 tools).

## Interface

OpenAPI 3.1 for `https://api.fidel.uk/v1`. Fidel publishes no standalone spec file; every page of https://reference.fidel.uk embeds the official definition for its endpoint (also served as `<page>.md`, indexed at https://reference.fidel.uk/llms.txt). `document.json` merges those per-page definitions, dropping only the redundant `Fidel-Key`/`Content-Type` header parameters and a stray `/v1` prefix on the mid-insights path. No MCP server or GraphQL API exists.

## Auth

API key (`apiKey`): the secret test or live key (`sk_test_...` / `sk_live_...`), sent in the `Fidel-Key` header. Find it on the Account page of https://dashboard.fidel.uk. Test and live keys address different data; add one account per mode.

## Known gaps

- One operation (Create Card) is skipped: it authenticates with the SDK public key (`pk_...`), not the secret key. Cards are normally linked through Fidel's client SDKs.
- Create Transaction works in test mode only; Send Offer to Brand works only in live mode for non-self-funded offers.
- The Offers as a Service product (https://fidel-oaas.readme.io) is a separate API and is not covered.
