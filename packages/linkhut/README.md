# Linkhut

Save, search and organize bookmarks and tags on [Linkhut](https://ln.ht): `posts.add`, `get`, `recent`, `dates`, `all`, `suggest`, `update`, `delete` and `tags.get`, `rename`, `delete` (11 tools).

**Interface:** hand-written tools over the official Pinboard-compatible API at `https://api.ln.ht/v1` (documented at https://docs.linkhut.org/overview.html). Linkhut publishes no OpenAPI document, GraphQL API or MCP server. Every Linkhut method is a GET; the write methods are still declared as mutations and require approval.

**Auth**
- Personal access token: create one at https://ln.ht/_/oauth/personal-token. It has unrestricted access to your account.
- OAuth: register an OAuth application at https://ln.ht/_/oauth/register and enter its client ID and secret on the connect page. Register Executor's callback URL as the application's redirect URI. Scopes requested: `posts:read posts:write tags:read tags:write`. Authorization is at `https://ln.ht/_/oauth/authorize`, tokens at `https://api.ln.ht/v1/oauth/token`; tokens expire after a year and are refreshed with the refresh token.

**Rate limits and identification:** calls are serialized per token with at least one second between request starts, 500 and 999 responses are retried up to three times with exponential backoff (2s, 4s, 8s), and every request sends `User-Agent: executor-linkhut/0.0.1`. The queue is in memory, so separate Executor processes do not share it.

**Known gaps:** the API has no current-user endpoint, so the health check calls `posts/update`. Linkhut's docs show the OAuth `client_id` and `client_secret` as query-string parameters on the token request; Executor's OAuth config can only send them in the form body (`client_secret_post`). This has not been confirmed against a real OAuth app (fake credentials return the same `invalid_client` either way), so OAuth should be treated as unverified and the personal token is the reliable method. Notes and other non-bookmark data are not exposed by the public API.
