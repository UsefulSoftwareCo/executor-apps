# Spendesk

Spend management with Spendesk: payables and settlements, suppliers, users, cost centers, analytical fields, expense categories, cards and transactions, purchase orders, invoices and intakes, chart of accounts, accounting exports, wallet and webhooks.

**Interface:** OpenAPI, Spendesk's official document at https://developer.spendesk.com/openapi/spendesk-public-api.json (production, `https://public-api.spendesk.com`; the sandbox host is not mounted). Mutations ask for approval.

**Auth**

- Public API credentials (`credentials`): create a client ID and secret under Settings > Developers in Spendesk (Spendesk calls this the customer flow). Executor exchanges them at `/v1/auth/token` with HTTP Basic and refreshes the token itself. The credential's own scopes apply.
- OAuth app (`oauth`): for Spendesk partners, authorization code with PKCE at `/v1/oauth2/authorize` and `/v1/oauth2/token/create`. Register the OAuth app with Spendesk and add Executor's redirect URI to it. Only stable scopes are requested; experimental scopes (purchase orders, cards, invoices, webhooks and others) are enabled per app by Spendesk.

**Known gaps**

- Tools backed by experimental scopes only work when Spendesk has enabled them for the credential.
- The organisation-level token mode needs an `X-Company-Id` header that tools cannot set; company-level credentials work.
- The Spendesk remote MCP server (`/v1/mcp`) requires an OAuth client created by an admin and is not mounted; the OpenAPI tools cover more.
