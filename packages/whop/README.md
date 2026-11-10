# Whop

Products, plans, memberships, payments, payouts, courses, chat, ads, affiliates and the rest of the Whop API (476 tools; 263 mutations require approval).

Interface: Whop's official OpenAPI 3.1 document, https://api.whop.com/api/v1/openapi.json, loaded live. Two operations are skipped because they use a second host (`multiple_hosts`). The document also lists a sandbox server (`sandbox-api.whop.com`), which is not used.

Auth:

- API key: create a company API key in the Whop dashboard under Developer, and paste it. It is sent as a bearer token.
- OAuth: create an app in the Whop Developer Dashboard (https://whop.com/dashboard/developer), add this Executor's OAuth callback as an exact-match redirect URI, copy the client ID (`app_...`) and secret, and select the scopes your tools need. Endpoints come from OIDC discovery at https://api.whop.com; PKCE (S256) is supported.

Known gaps: OAuth tokens only reach the operations covered by the scopes granted to your app.

OAuth details:

- Scopes: `openid profile email` (so `/oauth/userinfo` returns `sub` for the health check) plus 137 resource scopes taken from the per-operation security requirements of the OpenAPI document and advertised by Whop's discovery document. The spec names 22 more scopes that discovery does not advertise; they are not requested. Enable the same scopes on your app in the Developer Dashboard, or the authorize request will be rejected. Scopes are part of the provider identity, so they are fixed before connecting.
- Token requests: Whop documents JSON bodies for `/oauth/token` and refresh, so `tokenRequestFormat` is `json`.
- Client authentication: Whop's guide only shows public PKCE exchanges (`client_id` + `code_verifier`). Discovery advertises `none`, `client_secret_basic` and `client_secret_post`; the package declares `client_secret_post` (secret in the JSON body). This was not tested against a live app; if Whop rejects it, switch to `client_secret_basic`.
- Revocation: Whop documents `POST /oauth/revoke` with a JSON `{token, client_id}` body. Executor uses the `revocation_endpoint` from discovery and does not accept `revocationUrl` together with `discover`; revocation is best effort, and whether the host's request body matches Whop's JSON format is unverified.
- API key health check calls `GET /api/v1/accounts/me`, which the spec marks as needing `company:balance:read`; a key without that permission may show an unhealthy account while other tools still work.
- 11 operations in the official document carry `x-whop-docs: hidden` (for example `/accounts/me`, `/plans`, `/stats`, `/users/me`). They are in the public spec and are exposed.
