# ProAbono

Subscription management and billing with ProAbono: customers, offers, features, subscriptions, usage metering, pricing simulations, balance lines, billing and invoices (39 tools).

## Interface

Hand-written tools over the vendor's REST API, documented at https://doc-api.proabono.com/. ProAbono publishes no OpenAPI document, so every operation in that reference is declared in `index.ts`. Writes (every POST) require approval.

## Auth

HTTP Basic with the account's **Agent key** (username) and **API key** (password). Both, plus the account's **API endpoint** (for example `https://api-42.proabono.com`, different per account), are in the ProAbono BackOffice under Integration > API. The keys act like a service account, not a user. There is no OAuth for the API.

## Known gaps

- The endpoint is per account, so the connection asks for it; credentials go to `*.proabono.com`.
- The reference documents no customer delete, webhook management or list-payments endpoints, so none are exposed.
- Request bodies are passed through as the JSON documents ProAbono documents; field-level schemas are not modelled.
- Health check calls `GET /v1/Customers?SizePage=1`; a 204 (account with no customers) counts as healthy.
- An empty 2xx answer (ProAbono returns 204 when a list or lookup has no result) is returned as `null`, so it can be told apart from a write that returns a document.
- 39 tools cover the core documented operations. The query flags are optional parameters (EnsureBillable, TryStart, BillNow, Migration, Immediate, IgnoreEngagement, paging). Vendor operations not exposed: the HTML/in-site link helpers and less common per-resource variants beyond those listed.
- POST tools that need a body (customers.createOrUpdate, subscriptions.create, balanceLines.create, billing.billCustomer, pricing.subscription, pricing.usage, pricing.balanceLine) require `body`.
- The endpoint must be an https:// URL (checked when the connection is used).
- The `/v1/Pricing/*` simulations change nothing but are POSTs, so they still ask for approval.
