# ThriveCart

Manage a ThriveCart account: list and read products, order bumps, upsells and downsells (with pricing options), search transactions, look up customers, refund order items, cancel/pause/resume subscriptions, manage affiliates (create, register, approve, reject, favorite, delete, custom commissions) and subscribe webhook URLs to events. Mutating tools require approval.

Interface: hand-written tools over ThriveCart's REST API at `https://thrivecart.com/api/external`. ThriveCart publishes no OpenAPI document (its reference at https://apidocs.thrivecart.com is behind a login), so the endpoints and parameters come from the official PHP SDK (https://github.com/thrivecart/php-api) and its demo suite (https://github.com/thrivecart/api-demo). Request/response shapes are returned as raw JSON; parameters that the SDK does not document (for example extra fields beyond those listed) are not exposed.

## Auth

- API key: in ThriveCart go to Settings > API & Webhooks and generate a key (format `XXXXXXXX-XXXXXXXXXX-XXXXXXXX-XXXXXXXX`). Sent as `Authorization: Bearer <key>`.
- OAuth: register an app at https://developers.thrivecart.com/apps/create/ and enter its client ID and secret. Authorization `https://thrivecart.com/authorization/new`, token `https://thrivecart.com/authorization/token`. Add Executor's redirect URI shown on the connect page to the app. ThriveCart documents no scopes, so none are requested.

The `mode` input on order-related tools selects live or test orders (`X-TC-Mode` header). Requests are limited to 60 per minute per account.

## Known gaps

The coupon and customer hub APIs are listed by ThriveCart as "coming soon". OAuth was configured from the SDK source; the token endpoint's client authentication method (body credentials) is assumed from the SDK's OAuth library defaults and was not exercised against a live app.
