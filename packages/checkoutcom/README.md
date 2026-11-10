# Checkout.com

Payments, captures, refunds and voids, payment sessions and links, instruments, customers, disputes, balances, workflows, payouts, forex and sub-entities through the Checkout.com API.

Interface: Checkout.com's official OpenAPI definition, https://api-reference.checkout.com/v1/swagger.json (140 tools; every mutation asks for approval).

Auth, two methods. Both ask for the environment (`sandbox` or `production`) and the account's unique URL prefix (Dashboard > Developers > Overview; the hosts are `https://<prefix>.api.checkout.com` and `https://<prefix>.api.sandbox.checkout.com`).
- Secret API key (`sk_sbox_...` or `sk_...`, Developers > Keys). It reaches only the operations whose security allows a secret key.
- OAuth client credentials: create an access key (Developers > Keys > access keys) and enter its ID and secret plus the space-separated scopes it was granted, for example `gateway vault flow disputes balances`. The package exchanges them with basic client authentication at `https://<prefix>.access[.sandbox].checkout.com/connect/token` (the per-account token server documented in the API reference) and caches the token until it expires. This unlocks the OAuth-only operations (Accounts, Balances, Issuing, Identity verification and more). The vendor's reference documents the prefixed host, which is used here.

The health check lists workflows (`GET /workflows`), which needs the flow scope; a 403 is accepted as "credentials valid, scope missing" (not verified against a live account, since no credentials were used). A 401 fails the check.

Known gaps:
- 3 operations are skipped because they accept only a public key or an unsupported scheme.
- Operations on the fixed files and forward hosts are left out by the allowed origin.
- Public API keys (client-side use) are not supported.
- The Checkout.com MCP server only searches documentation and is not mounted.
