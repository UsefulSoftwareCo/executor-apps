# Zuora

Zuora subscription billing: accounts, subscriptions, orders, invoices, payments, usage, product catalog, credit memos and the rest of the Zuora Billing, Payments and Central Platform REST API (446 tools, 279 of them mutations that each require approval).

Interface: OpenAPI, Zuora's official REST API reference at https://developer.zuora.com/yaml/swagger.yaml (Swagger 2.0, compiled live). The document names only the US Cloud 2 production host, so the provider pins each account's own REST host instead.

## Auth

OAuth client credentials. In Zuora, open Administration > Users, pick the user, and create an OAuth client; copy the client ID and secret (the user's roles decide what the API may do). Add the account with:

- REST base URL: your tenant's endpoint, for example `https://rest.zuora.com`, `https://rest.na.zuora.com`, `https://rest.eu.zuora.com` or a sandbox host such as `https://rest.apisandbox.zuora.com`. Only `zuora.com` hosts are accepted.
- Client ID and client secret.

The package exchanges them at `<base URL>/oauth/token` (grant type `client_credentials`) and sends the bearer token only to that host. There is no browser OAuth flow because Zuora's OAuth clients are created per user in each tenant.

## Known gaps

- Zuora also publishes a remote MCP server (OAuth, https://apisandbox.zuora.com/mcp for sandbox); it is not mounted, since the REST API already covers the product.
- Zephr (Admin API, HMAC key pairs), Revenue and Collections have separate APIs and are not included.
