# FreeAgent

Accounting for freelancers and small businesses: company settings, users, contacts and notes, projects, tasks and timeslips (with timers), invoices, recurring invoices, estimates, credit notes and reconciliations, bills, expenses, attachments, bank accounts, transactions and explanations, categories, journals, price list and stock items, capital assets, VAT, corporation tax, final accounts and self assessment returns, payroll, and the profit and loss, balance sheet, trial balance and cashflow reports. 200 tools.

**Interface:** hand-written tools over the FreeAgent API v2 (`https://api.freeagent.com/v2`, documented at https://dev.freeagent.com/docs). FreeAgent publishes no OpenAPI document and no official MCP server, so the endpoints are transcribed from the official docs. Every request sends the required `User-Agent`. Write tools take a `body` with the resource's attributes (the tool adds FreeAgent's wrapper key, for example `{ "invoice": ... }`). Related resources are referenced by URL, as FreeAgent does. List results add `_totalCount` from `X-Total-Count`. Mutations require approval.

**Auth**

FreeAgent has no personal access tokens; access is OAuth 2.0 only.

- `oauth` (live company): create an app in the FreeAgent Developer Dashboard at https://dev.freeagent.com/apps and enter its client id and secret in the connect page. Register Executor's callback URL as the app's OAuth redirect URI. FreeAgent apps have no scopes; the token carries the authorising user's own permission level.
- `sandbox`: the same flow against `https://api.sandbox.freeagent.com`, using an app created in the Developer Dashboard for a sandbox account.

**Known gaps**

- The accountancy practice API (managing client companies from a practice account) is not included.
- Attachments uploaded as base64 inside a bill or expense body work; separate multipart upload does not.
- Payroll profile and some report parameters follow the docs but are not verified with a real account.
- Not verified with real credentials.
