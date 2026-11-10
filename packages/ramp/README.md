# Ramp

Ramp corporate cards, transactions, bills, reimbursements, users, vendors, spend limits, purchase orders, accounting, treasury and the rest of the Ramp Developer API (258 tools, none skipped; the token mint and revoke endpoints are removed because they need HTTP Basic client credentials, not the bearer token).

## Interface

OpenAPI, Ramp's official Developer API document: https://docs.ramp.com/openapi/developer-api.json (API host `https://api.ramp.com`).

## Auth

Both methods are OAuth 2.0 and use a developer app created in the Ramp Developer Console (Settings, Developer, Create new app). Token requests use HTTP Basic client authentication.

- `clientCredentials`: for your own Ramp business. Enable the Client Credentials grant on the app and enter its client ID and secret. Token URL `https://api.ramp.com/developer/v1/token`.
- `oauth` (Authorization Code): for apps that other Ramp businesses authorize. Authorization URL `https://app.ramp.com/v1/authorize`. Enable the Authorization Code grant and also the Refresh Token grant (access tokens last 1 hour; without Refresh Token the connection stops working hourly), and register the Executor redirect URI shown on the connect page in the app's redirect URIs.

Requested scopes cover the generated tools except deliberate exclusions: card vault (`cards:read_vault`, PAN and CVV) and other vault scopes, SCIM, provisioning, incorporation and embedded cards. `offline_access` is not requested; Ramp documents only that the Refresh Token grant must be enabled on the app. `blank_canvas:write` and `approval_chains:write` are requested but must also be configured on the app. Scopes granted on the app limit what works. The health check reads `/developer/v1/business` (needs `business:read`).

## Gaps

- The sandbox environment (`demo-api.ramp.com`) is not offered.
- Tools needing the excluded scopes will fail until those scopes are added.
- Every mutation requires approval.
