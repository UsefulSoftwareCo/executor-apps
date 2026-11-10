# Pennylane

Accounting and invoicing for a Pennylane company: customer and supplier invoices, credit notes, quotes, ledger accounts and entries, journals, bank accounts and transactions, customers, suppliers, products, categories, file attachments, exports and webhooks.

Interface: OpenAPI. The Company API v2 document is published by Pennylane's docs host at https://pennylane.readme.io/openapi/accounting.json (title "Company V2", about 178 operations, one origin `https://app.pennylane.com`). Mutations require approval.

## Auth

- **Company API token** (`apiToken`): in Pennylane open Settings > Connectivity > API (see https://pennylane.readme.io/docs/generating-my-api-token), create a token and choose its scopes (the readonly/all scope of each resource you need). Sent as `Authorization: Bearer <token>`. Health check calls `GET /api/external/v2/me`.

## Known gaps

- OAuth 2.0 is not offered. Pennylane restricts it to registered integration partners and accounting firms (contact partnerships@pennylane.com); there is no user-created OAuth app, so only the company token is supported.
- Firm API tokens and the older v1 API (`api.pennylane.com`) are not covered.
