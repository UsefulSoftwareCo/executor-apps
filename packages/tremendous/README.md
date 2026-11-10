# Tremendous

Send rewards and payouts with Tremendous: orders, rewards, products, campaigns, funding sources, invoices, topups, balance transactions, members and organizations, webhooks, custom fields, reports and fraud reviews and rules.

**Interface:** OpenAPI, generated live from Tremendous's official spec at https://cdn.tremendous.com/openapi/spec.yml (the file Tremendous's own SDKs are generated from). 66 tools, 31 of them mutations; every mutation asks for approval. The spec lists the sandbox server first, so the package pins the base URL to production (`https://api.tremendous.com/api/v2`).

**Auth**

- API key: create one in the Tremendous dashboard under Team settings > Developers. Sent as a bearer token.
- OAuth: an admin registers an app under Team settings > Developers > Developer apps ("Register app"), then enters the client ID and secret on the connect page. Add the redirect URI Executor shows to the app. Scopes requested: `default`, `team_management`, `fraud_prevention`.

**Known gaps:** only the production environment is targeted; sandbox (`testflight.tremendous.com`) keys and apps will not work. The invoice PDF and CSV download tools return file content, not parsed data.
