# Tailscale

Manage a Tailscale tailnet: devices, users, auth keys and API keys, the ACL policy file, DNS, tailnet settings, webhooks, log streaming, posture integrations and more.

**Interface:** OpenAPI, Tailscale's official document at `https://api.tailscale.com/api/v2?outputOpenapiSchema=true` (the vendor notes this spec is "unstable" and may change). All operations live on `api.tailscale.com`. Use `-` as the `tailnet` path parameter for the token's own tailnet.

**Auth:** two methods.
- API access token (`tskey-api-...`), generated on the Keys page of the admin console (https://login.tailscale.com/admin/settings/keys). Tokens expire after at most 90 days.
- OAuth client (trust credential, `tskey-client-...`), using the client-credentials flow with no redirect URI. Create it in the admin console under Settings > Trust credentials > Credential > OAuth, choose the scopes the tools need (for example `all:read`, or `devices:core`, `dns`, `auth_keys`), then copy the client ID and secret. Executor exchanges them at `https://api.tailscale.com/api/v2/oauth/token`; access tokens last 1 hour. The health check lists devices, so the client needs `devices:core:read` or `all:read`.

**Gaps:** no official remote MCP server was confirmed (search budget ran out), so the OpenAPI document is used. mutations always require approval. The spec is unstable upstream, so tool names may shift.
