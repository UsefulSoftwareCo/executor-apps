# PayPal

PayPal checkout orders, payments (authorizations, captures, refunds), subscriptions and billing plans, invoicing, batch payouts, catalog products, customer disputes, webhooks, shipment tracking, vaulted payment tokens, transaction reports and partner referrals (115 tools, none skipped).

## Interface

OpenAPI, PayPal's official REST API documents in https://github.com/paypal/paypal-rest-api-specifications/tree/main/openapi (`https://raw.githubusercontent.com/paypal/paypal-rest-api-specifications/90e8041ffe02d80c452d2b476bedd59a8d219bdc/openapi/<name>.json`, pinned to commit `90e8041`; upstream changes need a deliberate bump). PayPal publishes one document per API, all on `https://api-m.paypal.com`; each is mounted under its own key in one router:

| Key | Document | Tools |
| --- | --- | --- |
| `orders` | `checkout_orders_v2` | 9 |
| `payments` | `payments_payment_v2` | 8 |
| `subscriptions` | `billing_subscriptions_v1` | 16 |
| `invoicing` | `invoicing_v2` | 22 |
| `payouts` | `payments_payouts_batch_v1` | 4 |
| `products` | `catalogs_products_v1` | 4 |
| `disputes` | `customer_disputes_v1` | 15 |
| `partnerReferrals` | `customer_partner_referrals_v2` | 2 |
| `webhooks` | `notifications_webhooks_v1` | 16 |
| `webExperienceProfiles` | `payment-experience_web_experience_profiles_v1` | 6 |
| `transactions` | `reporting_transactions_v1` | 2 |
| `tracking` | `shipping_shipment_tracking_v1` | 5 |
| `vault` | `vault_payment_tokens_v3` | 6 |

## Auth

`clientCredentials` (OAuth 2.0 client credentials, the way PayPal's REST APIs are normally used): create a REST app in the PayPal Developer Dashboard (https://developer.paypal.com/dashboard/applications/live, "Live" tab), tick the features the tools need (Transaction Search, Invoicing, Subscriptions, Payouts, Disputes, Vault and so on), and enter its client ID and secret. Executor exchanges them at `https://api-m.paypal.com/v1/oauth2/token` with HTTP Basic client authentication; no `scope` parameter is sent, as in PayPal's authentication guide (https://developer.paypal.com/api/rest/authentication/), whose sample response lists the scopes the token received. PayPal does not document exactly how those scopes are chosen, so the token is assumed to cover the features enabled on the app; operations it does not cover fail with 403. There is no redirect step, so no redirect URI is needed.

The health check lists webhooks (`/v1/notifications/webhooks`), because PayPal has no current-user endpoint for client-credentials tokens.

## Gaps

- Live environment only. Sandbox (`api-m.sandbox.paypal.com`) is not offered; PayPal's sandbox uses separate credentials and a different host.
- The Authorization Code flow is not offered. "Log in with PayPal" (https://developer.paypal.com/docs/log-in-with-paypal/integrate/, authorize at `https://www.paypal.com/connect`) can be enabled on a user's own app, but live use needs PayPal's review and approval of every scope, and its documented purpose is identity (the userinfo endpoint); PayPal does not document those user tokens calling the merchant REST APIs (invoicing, webhooks, orders) covered here.
- The Braintree GraphQL API and PayPal's remote MCP server (`https://mcp.paypal.com/mcp`) are not used; the REST documents cover more tools.
- Operations the app's enabled features do not allow fail with 403 until the feature is enabled.
- Every mutation requires approval.
