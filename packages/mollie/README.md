# Mollie

Payments, refunds, chargebacks, customers, mandates, subscriptions, payment links, terminals, settlements, balances, invoices, profiles, onboarding and webhooks from the Mollie API.

Interface: OpenAPI, loaded live from Mollie's official specification at https://raw.githubusercontent.com/mollie/openapi/main/specs.yaml (OpenAPI 3.1, API host `https://api.mollie.com`).

Auth:

- API key or access token (`token`): a website-profile API key (`live_...` / `test_...`) or an organization access token (`access_...`), both sent as a Bearer token. Create them in the Mollie Dashboard under Developers, API keys / API access tokens. Profile API keys cannot reach organization-level endpoints. The health check calls `profiles/me` for API keys and `organizations/me` for access tokens, so an access token needs the `organizations.read` permission to show as healthy.
- OAuth (`oauth`): Mollie Connect. Register an app in the Dashboard under Developers, Your apps, and enter its client ID and secret on the connect page. Set the redirect URI shown by Executor as the app's redirect URL. Scopes cover payments, refunds, customers, mandates, subscriptions, payment links, profiles, organizations, settlements, balances, invoices, terminals, payouts, events and webhooks (read and write); onboarding, client and business-account scopes are not requested.

Known gaps: the Mollie MCP server (`https://mcp.mollie.com/mcp`) is not mounted. Every mutation requires approval. The upstream spec is licensed CC-BY-NC-SA 4.0 and is fetched at runtime, not vendored.
