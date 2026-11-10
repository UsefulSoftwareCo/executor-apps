# Monday

Boards, items, columns, updates, workspaces, users, docs and the rest of monday.com's Platform API.

**Interface:** GraphQL, monday.com's primary API, at `https://api.monday.com/v2` (the schema is read by introspection; see https://developer.monday.com/api-reference/). Every mutation asks for approval.

## Auth

- **Personal API token** (`apiKey`): in monday.com, click your profile picture, choose Developers, then API token, Show (account admins can also use Administration, Connections, Personal API token). Sent as the raw `Authorization` header value.
- **OAuth** (`oauth`): create an app in the monday.com Developer Center, add the OAuth feature, and request the scopes it needs (`me:read`, `boards:read`, `boards:write`, `workspaces:read`, `users:read`, `updates:write`, and so on). Add the Executor redirect URI shown on the connect page to the app's Redirect URLs. The client ID and secret are entered on the connect page. The OAuth access token is sent raw in `Authorization`, as in monday's OAuth migration guide; monday's OAuth page calls the tokens "bearer" tokens, so the vendor docs are not explicit about this case and it has not been tested against a live account. Endpoints: `https://auth.monday.com/oauth2/authorize` and `https://auth.monday.com/oauth2/token`.

## Known gaps

- monday.com's hosted MCP server (`https://mcp.monday.com/mcp`) is not used; the GraphQL API is broader.
- The icon is the monday.com three-shape mark, taken from https://upload.wikimedia.org/wikipedia/commons/c/c6/Monday_logo.svg (monday.com's own brand/press SVG was not reachable: the known monday.com asset URL returns 404 and the brand resources page is gated), with the wordmark removed.
