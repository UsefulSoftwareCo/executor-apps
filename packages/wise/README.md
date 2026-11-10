# Wise

Covers the Wise Platform API: profiles, balances and balance statements, quotes, recipients, transfers, batch groups, bank account details, activities, cards and spend controls, addresses, webhooks and more.

**Interface:** OpenAPI. Tools are generated from Wise's official, versioned API description (2026Q4), downloaded from the Wise developer portal at `https://docs.wise.com/_bundle/api-reference/@latest/index.json?download` (linked from https://docs.wise.com/api-reference). Calls go to `https://api.wise.com/2026Q4`. The source URL points at `@latest`, so the tools will change when Wise publishes a new bundle. Every mutation requires approval.

**Auth:** personal API token. Create one in Wise.com under Settings > Connect and manage apps > API tokens (the path given in the Wise API description; Business and personal accounts can both create one). The token is sent as a bearer token. Personal tokens have limited access: for UK/EEA accounts PSD2 rules block some endpoints (for example balance statements and funding transfers) and Wise rejects those calls.

**Known gaps:** Wise OAuth 2.0 (authorization code / client credentials) is only available to Wise Platform partners who are issued a client ID and secret by Wise, so it is not offered; the many partner-only operations in the description will return authorization errors with a personal token. The sandbox host (`api.wise-sandbox.com`) is not supported.
The 8 skipped operations span other hosts (multiple_hosts, 7) or use an unsupported auth method (1); they are left out.
