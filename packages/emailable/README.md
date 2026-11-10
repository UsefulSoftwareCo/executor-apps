# Emailable

Verifies email addresses with Emailable: single verification, asynchronous batches (up to 50,000 emails, optional webhook), batch status and results, and account credits.

Interface: hand-written tools over the REST API at `https://api.emailable.com/v1`, documented at https://emailable.com/docs/api/. Emailable publishes no OpenAPI document, MCP server or GraphQL API, and the API has only four operations, so all four are exposed: `account`, `verify`, `createBatch` (asks approval), `getBatch`.

Auth:

- API key: create a Private API key in the Emailable dashboard (https://app.emailable.com, API section). Sent as a Bearer token. Public API keys only work for `/verify` from trusted domains and will fail the health check; use a private key. Keys starting with `test_` return simulated results without spending credits.
- OAuth 2 (authorization code): create an OAuth app in Emailable, enter its client ID and secret on the connect page, and register Executor's callback URL as the app's redirect URI. Authorize `https://app.emailable.com/oauth/authorize`, token `https://app.emailable.com/oauth/token`. Emailable does not implement scopes (it reports `all`).

Known gaps: the embeddable widget and OAuth device grant are not exposed. Batches over 1,000 emails return a CSV `download_file` link rather than inline results.

Icon: Emailable's official app icon PNG (600px) from the vendor's site.
