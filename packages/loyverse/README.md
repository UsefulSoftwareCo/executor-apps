# Loyverse

Loyverse point of sale: items, categories, modifiers, inventory, receipts and refunds, customers, stores, employees, shifts, payment types, taxes, suppliers, POS devices and webhooks.

## Interface

OpenAPI, from Loyverse's official document at https://developer.loyverse.com/docs/API-Reference__v1.0.yaml (server `https://api.loyverse.com/v1.0`). Every mutation requires approval.

## Auth

- **Access token**: sign in at https://developer.loyverse.com, open Apps, and create an access token for your own account. It is sent as a bearer token.
- **OAuth 2.0**: create a developer app at https://developer.loyverse.com/apps and enter its client ID and secret on the connect page. Add the redirect URI shown by Executor to the app's redirect URL list. Endpoints come from `https://api.loyverse.com/.well-known/openid-configuration`. Access tokens last 12 hours and are refreshed with the refresh token. Scopes requested cover reading and writing items, inventory, customers, receipts, POS devices, suppliers and taxes, plus read access to the merchant, employees, shifts, stores and payment types.

## Known gaps

The token and refresh requests send client_id and client_secret in the form body (client_secret_post), per the vendor spec. The official OpenAPI document has 57 operations, and this package exposes all 57. Webhook tools have no matching permission in the vendor table and are untested under OAuth. Scope names follow the vendor docs (upper case); the discovery document lists them in lower case. No OAuth userinfo scopes are requested. Health check reads `/merchant/`, which needs the access token or `MERCHANT_READ`.
