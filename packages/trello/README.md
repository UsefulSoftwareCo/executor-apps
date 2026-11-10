# Trello

Boards, lists, cards, checklists, labels, custom fields, members, workspaces (organizations), enterprises, webhooks and search from the Trello REST API.

**Interface:** OpenAPI, Atlassian's official definition at https://developer.atlassian.com/cloud/trello/swagger.v3.json (261 tools, 133 mutations; mutations require approval).

**Auth:** two methods.
- `credentials` (API key and token): open https://trello.com/apps/admin, create or open a Power-Up, and on its "Trello Auth" tab copy the API key and use "Generate a Token" (or authorize via `https://trello.com/1/authorize?key=<key>&scope=read,write,account&expiration=never&response_type=token`). Enter both on the connect page. They are sent as `key` and `token` query parameters to `api.trello.com`.
- `oauth` (OAuth 2.0): on the "OAuth 2.0" tab of the same app at https://trello.com/apps/admin, create a confidential client, add the redirect URI shown on Executor's connect page as a callback URL, and enter the client ID and secret there. Authorization uses `https://auth.atlassian.com/authorize` and `https://auth.atlassian.com/oauth/token` (client credentials in a JSON body), with the Trello scopes from the definition plus `offline_access` for refresh tokens. Access tokens are sent as `Authorization: Bearer` to `api.trello.com`. Trello's documented Bearer sample targets `trello.com/1/...`; I could not confirm against a live token that `api.trello.com` (the definition's only server) accepts it too.

**Gaps:** Trello's classic OAuth 1.0a flow is not supported by the framework; the key and token cover the same access. The definition's per-operation OAuth2-only security was replaced with the key + token pair or a Bearer token. Trello's remote MCP server (https://mcp.trello.com/v1) exposes far fewer tools and is not used.
