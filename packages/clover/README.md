# Clover

Clover point-of-sale data through the Platform REST API (v3): merchants, inventory (items, categories, modifiers, tax rates), orders and line items, payments and refunds, customers, employees and shifts, cash events, devices, apps, metered billing and notifications.

## Interface

OpenAPI. The "Platform API" definition Clover publishes on its developer hub (docs.clover.com), read from the hub's public registry: `https://dash.readme.com/api/v1/api-registry/1836s2z4smohp2458`. It is Clover's own document, not a third-party conversion. Clover's other definitions (Ecommerce, card-present, tokenization, invoices) are separate products and are not included.

## Auth

Merchant API token. Fields:

- Region: `na` (api.clover.com), `eu` (api.eu.clover.com), `la` (api.la.clover.com) or `sandbox` (apisandbox.dev.clover.com).
- Merchant ID: the merchant's ID (the `mId` in `/v3/merchants/{mId}`), used for the health check.
- Token: create it in the Clover web dashboard under Business Operations > API tokens > Create new token, choosing the permissions to grant. For sandbox, use a test merchant's token from the Clover developer dashboard.

Clover's [OAuth and tokens FAQ](https://docs.clover.com/dev/docs/oauth-and-tokens-faqs) recommends merchant-generated API tokens for internal tools where you control both the application and the merchant account, while the [sandbox test token guide](https://docs.clover.com/dev/docs/generate-a-test-api-token) describes its tokens as for testing.

The three production hosts are listed on Clover's [API reference overview](https://docs.clover.com/dev/docs/api-reference-overview): North America (US and Canada) `api.clover.com`, Europe `api.eu.clover.com` and Latin America `api.la.clover.com`.

## Known gaps

- OAuth is not offered. Clover's v2 OAuth returns the merchant ID on the redirect, uses regional authorize/token hosts, issues 30 minute access tokens (expiry given as an absolute timestamp) and refreshes through a separate `/oauth/v2/refresh` endpoint. The framework's OAuth flow can carry none of those, so a connected account could not be refreshed or identify its merchant.
- Tools take the merchant ID as an argument per call; one account is bound to one merchant for the health check only.
