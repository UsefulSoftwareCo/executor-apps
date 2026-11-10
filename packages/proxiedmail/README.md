# ProxiedMail

Create and manage ProxiedMail proxy email addresses (proxy bindings), their webhook callbacks, received emails and contacts, plus account/user endpoints.

Interface: OpenAPI, from the vendor's own documentation repository, https://raw.githubusercontent.com/proxied-mail/api-docs/master/openapi.yaml (the source of https://docs.proxiedmail.com). 34 tools, 18 of them mutations (all require approval). API host: `proxiedmail.com`.

## Auth

API token (`Token` header). Sign in at https://proxiedmail.com, then obtain the long-lived token as described at https://docs.proxiedmail.com/docs/endpoints/apiToken (call `POST /api/v1/auth` with your username and password for a short-lived Bearer token, then `GET /api/v1/api-token`). There is no OAuth.

## Known gaps

- `POST /api/v1/auth` and `GET /api/v1/api-token` use the short-lived Bearer scheme, which this package does not inject, so they will not work with a stored API token. Obtain the token once outside Executor.
- The spec is vendor-maintained but not versioned at a stable docs URL; it is read from the GitHub repository's default branch.
