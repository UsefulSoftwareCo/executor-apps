# DualEntry

Covers DualEntry accounting through the Public API v2: companies, accounts, items, classifications, customers, vendors, invoices, bills, payments, purchase orders, journal entries, recurring transactions, attachments, fixed assets and depreciation books, bank connections and bank matching, and tax calculation (306 tools, 148 of them mutations, which require approval).

Interface: OpenAPI, compiled live from DualEntry's official document at https://api.dualentry.com/public/v2/openapi.json (listed at https://docs.dualentry.com/llms.txt). The document declares no security scheme, so `openapi.ts` supplies an `X-API-KEY` header scheme applied globally.

## Auth

API key only. An organization Admin creates a key in DualEntry under Settings > Organization > Developer access > API Keys and assigns it roles (View-Only for reads; Accounts Payable, Accounts Receivable or Accountant for writes). The key is shown once. Paste it as the account's API key; it is sent as `X-API-KEY`. A key is bound to one organization and reaches every company in it. Sandbox and production use the same host.

## Known gaps

- DualEntry also runs an official remote MCP server at https://api.dualentry.com/mcp (OAuth with dynamic client registration). It is not mounted: the REST API covers the same data and an account here is a single method. OAuth is not offered for the REST API.
- Only v2 is exposed; v1 and the v3-alpha documents are not mounted.
