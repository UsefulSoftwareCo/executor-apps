# SendFox

Manage SendFox email marketing from Executor: contacts, lists, tags, custom contact fields, campaigns and templates, forms, automations, sending domains, and transactional email (71 tools, 39 of them mutations that require approval).

## Interface

OpenAPI, from SendFox's official document at https://sendfox.com/openapi.yaml (API reference: https://sendfox.com/developer/docs). All calls go to `https://api.sendfox.com`.

## Auth

- **Personal access token** (`token`): create one in SendFox under Settings, API tokens (https://sendfox.com/account/oauth) and paste it into the connect page. Sent as a bearer token.
- **OAuth 2.0** (`oauth`): create an OAuth client on the same page (Create New Client) and enter its client ID and secret on the connect page. The redirect URL saved on the client must exactly match the redirect URI Executor shows. Authorization URL `https://sendfox.com/oauth/authorize`, token URL `https://sendfox.com/oauth/token`. Scopes requested: `transactional:send` and `transactional:read`, the only scopes the spec declares; the transactional email endpoints return 403 `insufficient_scope` without `transactional:read`, and the spec's global security needs no scopes for the other routes. The token endpoint is called with `client_secret_post` (credentials in the form body); SendFox's docs do not state the method, so this is unverified against a live exchange (the authorize page requires a logged-in session).

API access requires a Lifetime or Empire plan; free users cannot use the API (the spec documents HTTP 402 "API access requires a paid plan"). Rate limit is 60 requests per minute per user.

## Known gaps

- OAuth scopes follow the spec (`transactional:send`, `transactional:read`); not tested against a live account, and the `client_secret_post` token auth method is unverified.
- `hosts` includes `sendfox.com` because the OAuth token exchange goes to `https://sendfox.com/oauth/token`.
