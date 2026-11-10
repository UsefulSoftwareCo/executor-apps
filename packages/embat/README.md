# Embat

Treasury management with [Embat](https://www.embat.io): bank connections, accounts, balances, transactions, payments, operations (invoices and bills), accounting entries, budgets and categories.

Interface: OpenAPI, from Embat's own document at https://api.embat.io/openapi.json (API reference: https://api.embat.io/docs). The document declares no servers, so `baseUrl` and the origin `https://api.embat.io` are pinned in `openapi.ts`.

## Auth

- **Service user email and password.** Embat's API uses password-based JWT auth: `POST /authentication/token` with the email and password returns an `idToken` used as a Bearer token. Tokens last 60 minutes with no refresh endpoint, so the package signs in again (cached for 50 minutes, and again after any 401). Service users with multi-factor authentication enabled cannot use the API. Request service user credentials (sandbox first, if testing) from Embat support at tech@embat.io or in the Embat app.

Embat does not offer OAuth or API keys.

## Known gaps

- Only the document's operations are exposed. Every mutation requires approval.
- The generated `authentication/token` tool is redundant; sign-in is handled automatically.
