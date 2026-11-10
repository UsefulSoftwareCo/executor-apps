# Buffer

Schedule and publish social posts, manage channels, ideas, tags, and read post
metrics (see Known gaps) through Buffer's GraphQL API.

Interface: GraphQL at https://api.buffer.com (official; introspection is open, so
tools are generated from the live schema). Docs: https://developers.buffer.com.
Buffer also runs an MCP server (https://mcp.buffer.com/mcp), but the GraphQL API
is the primary and more complete surface. Mutations require approval.

## Auth

- API key: create one at https://publish.buffer.com/settings/api. Sent as
  `Authorization: Bearer <key>`. The key reaches every organization you belong to.
- OAuth 2.0 (authorization code with PKCE, client secret in the POST body): register
  an app on the same page under App Clients, then enter its client ID and secret on
  the connect page. Buffer requires an exact, HTTPS redirect URI registered on the
  client; use the redirect URI Executor shows. Scopes requested: `offline_access`,
  `account`, `posts`, `ideas` and `snippets` read/write. Refresh tokens rotate.

## Known gaps

The `insights:read` and `engagements:*` scopes are not requested by default; add
them if you need those fields.

Post metrics fields are documented for personal API keys; Buffer does not say they
are available to OAuth-connected accounts, so they may be missing or empty there.
Buffer documents no token revocation endpoint: remove the app in Buffer settings.
