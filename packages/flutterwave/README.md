# Flutterwave

Payments in Africa and globally through Flutterwave API v3: transactions (list, verify, timeline, fees), refunds, hosted payment links, direct charges for non-card methods, transfers and bulk payouts, beneficiaries, payment plans, subscriptions, subaccounts, virtual accounts, bills, banks, wallet balances and statements, settlements, chargebacks and BVN verification.

## Interface

Hand-written tools over `https://api.flutterwave.com/v3` with `fetch`. Flutterwave publishes no OpenAPI document or GraphQL API that we could find (checked developer.flutterwave.com and its llms.txt; /openapi.json returns 404). The absence of an official remote MCP server is unverified (no web search was available to confirm it), so the tools follow the vendor's API reference. Every mutation requires approval. Endpoints that take large payloads accept a `body` object that is sent to Flutterwave as is; the description of each tool lists the required fields.

## Auth

- Secret key (`apiKey`): create it in the Flutterwave dashboard under Settings, API Keys. Use a test key (`FLWSECK_TEST-...`) to experiment. It is sent as a bearer token to `api.flutterwave.com`.

Flutterwave v3 has no OAuth for merchants, so no OAuth method is offered. The account health check reads wallet balances.

## Gaps

- Direct card charges need client-side encryption with the account's encryption key and are not supported; use payment links or other charge types.
- API v4 is not covered; only v3 is.
- Webhooks are not covered.

## Verification

Every path, method, required parameter and body field was compared with the vendor's per-endpoint API reference pages (https://developer.flutterwave.com/reference/*.md, listed in https://developer.flutterwave.com/llms.txt). Tools for endpoints that the reference does not document (transaction reference generation, payment link disable) were removed. Notes:

- `transfers.createBulk`: the reference page's `bulk_data` item schema (email, mobile_number, recipient_address) disagrees with the Bulk Transfers guide (https://developer.flutterwave.com/docs/bulk-transfer.md), which shows bank payout items as `{ bank_code, account_number, amount, currency, narration }`. The tool passes `body` through unchanged; its description records both.
- `payoutSubaccounts.listReversals` is `GET /payout-subaccounts/refunds` (Query wallet reversals); `initiateRefund` is the matching POST.
- A few pages (payment plan update, subaccount update, token update, virtual account status update) were confirmed only for path and method, not for every body field.
