# Adobe Marketing Agent

Authorized Adobe marketing context, preferences and agent capabilities from
Adobe's hosted Marketing Agent (Adobe Experience Platform) service.

Interface: Adobe's official remote MCP server, `https://aep-ai-ama.adobe.io/mcp`
(listed on https://developer.adobe.com). Tools are whatever the server lists for
the account; the list needs credentials, so the tool count
is unknown here.

Auth:

- OAuth (`oauth`): the server publishes OAuth metadata (authorization code with
  PKCE S256, refresh tokens) and a dynamic client registration endpoint at
  `https://aep-ai-ama.adobe.io/register`. The account must have access to
  Adobe's Marketing Agent.

**Connect limitation.** Adobe's registration endpoint accepts only an allowlist
of redirect URIs. Registration with `http://127.0.0.1:4399/api/oauth/callback`
(the local Executor callback) succeeds, but `https://` callbacks, including
`https://executor.sh/_executor/auth/callback` and
`https://app.executor.sh/_executor/auth/callback`, return
`400 invalid_redirect_uri`. Hosted Executor's https callback is therefore
expected to be refused unless Adobe allowlists it, so connecting on hosted
Executor is not verified and is likely to fail. Adobe's community reports the
same behaviour for its Analytics/CJA MCP servers; their workaround is an OAuth
credential created in the Adobe Developer Console with the custom redirect URI,
which Executor's connect page can take as a user-supplied client. No full OAuth
connect (sign-in and token exchange) was tested, only the metadata, the
unauthenticated probe and loopback registration.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: no API-key method exists. Account health only verifies the token
reaches the MCP server. Icon exception: the icon is Adobe's corporate mark.
Simple Icons has no Adobe entry and Adobe publishes no separate mark for this
service; the corporate mark is used knowingly as the only available logo.
