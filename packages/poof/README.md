# Poof

Poof (poof.io) payment processing: crypto deposit addresses, wallets, payment links and payouts, fiat charges, invoices and hosted checkouts, webhook subscriptions, wallet balances and transaction history.

**Interface:** hand-written tools over Poof's JSON API at `https://www.poof.io`, taken from Poof's official API page https://www.poof.io/api (paths and bodies as documented there, mostly `/api/v1/`, with `create_wallet` and `create_charge` under `/api/v2/`). The per-endpoint pages at docs.poof.io/reference return 404, and no official OpenAPI document or MCP server was found, so tools return the raw JSON response. 11 tools in four groups: `crypto`, `fiat`, `webhooks`, `transactions`. A follow-up search for an official Poof OpenAPI or MCP server may still be worthwhile.

**Auth:** API key. Sign in at https://www.poof.io/developers to copy it. Poof expects the key as the raw `Authorization` header with no `Bearer` prefix. The account health check lists transactions, a read-only call. Poof offers no OAuth for third-party apps. Poof documents `/api/v1/checkout` as needing no key; the key is sent anyway.

**Approvals:** every tool that creates a wallet, charge, invoice, checkout, address or webhook, or moves funds (payout), requires approval.

**Gaps:** prices, gas prices and the smart-contract list have no paths documented by Poof, so they are omitted, as are ACH debit, transfer status, transaction search and product fetch (no vendor reference). The MPC wallet endpoints (v3 guides) are not covered.
