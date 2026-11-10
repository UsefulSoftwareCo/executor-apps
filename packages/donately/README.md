# Donately

Manage a Donately fundraising account: accounts, campaigns, donations (including refunds and receipts), recurring subscriptions, donors, peer-to-peer fundraisers, donation forms and webhooks. 38 tools.

## Interface

Hand-written tools over the official REST API v2 (`https://api.donately.com/v2`), documented at https://developer.donate.ly/api/. Donately publishes no OpenAPI document, and its official MCP server only serves its developer docs, so each operation is declared in `operations.ts` and called with `fetch`. Requests send `Donately-Version: 2022-12-15`. Reads are queries; every POST and DELETE needs approval.

Each tool takes `id` (for `/:id` paths), `query` (query parameters, such as `account_id`, `limit`, `offset`) and, for writes, `body`. Date range filters pass as `{ gt, lt }` objects.

## Auth

API token (`apiKey`). Create it in the Donately dashboard under Settings > API (dash.donately.com/integrations/api). It is sent as HTTP Basic auth, `base64("<token>:")`. A token belongs to a user and reaches the accounts that user administers, so pass `account_id` (find it with `accounts.mine`). Donately has no OAuth for third-party apps.

## Known gaps

- Request bodies are untyped JSON; the docs do not list every create/update field.
- Endpoints documented as public (donation creation, form config) are still called with the token.
