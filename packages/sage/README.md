# Sage

Sage Accounting (Sage Business Cloud Accounting) API v3.1: customers and suppliers, sales and purchase invoices, quotes, credit notes, payments and allocations, products, services, stock items, ledger accounts, journals, bank accounts, deposits and transfers, attachments, tax rates and reference data (126 tools).

This is Sage Accounting only. Sage 50, Sage 200, Sage Intacct, Sage HR, Sage People and the other Sage products have separate APIs and are not covered.

## Interface

Hand-written tools over `https://api.accounting.sage.com/v3.1`. Sage's API reference at https://developer.sage.com/accounting/reference/ is behind a bot challenge and publishes no OpenAPI document we could fetch, so the tools follow the documented resource paths. They are generic per resource (`list`, `get`, `create`, `update`, `delete`) and pass request bodies through as Sage's JSON, wrapped in the resource key, for example `{ "contact": { ... } }`. Resources have not been exercised against a live Sage account.

Every tool takes an optional `business` id, sent as the `X-Business` header; omit it to use the user's lead business. `account.businesses` lists the ids.

## Auth

OAuth 2.0 only; Sage Accounting has no personal API keys.

1. Register an app at https://developer.sage.com/accounting (Create app) and note its client ID and secret.
2. Add Executor's OAuth callback URL as the app's callback URL (the connect page shows it).
3. Enter the client ID and secret on Executor's connect page.

Authorization uses `https://www.sageone.com/oauth2/auth/central?filter=apiv3.1` and tokens come from `https://oauth.accounting.sage.com/token`, with scope `full_access` (Sage also offers `readonly`).

## Known gaps

- Reports, VAT return submission, and Sage's country-specific endpoints (for example Spanish and German tax types) are not exposed.
- Sage Accounting access tokens expire after five minutes and refresh tokens rotate; Executor handles refresh.
