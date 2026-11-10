# Front

Conversations, messages, drafts, inboxes, channels, contacts, tags, teammates, rules and the rest of the Front Core API (147 paths).

Interface: OpenAPI, from Front's official spec repository,
https://raw.githubusercontent.com/frontapp/front-api-specs/main/core-api/core-api.json
(https://github.com/frontapp/front-api-specs). Requests go to `https://api2.frontapp.com`. Mutations require approval.

Auth:

- API token: in Front, Settings > Developers > API tokens, create a token with the scopes you need and paste it.
- OAuth: create an app in Front under Settings > Developers > Apps, enable OAuth, and set the scopes on the app (Front does not take scopes in the authorize request). Enter the app's client ID and secret on the connect page and add Executor's redirect URI to the app's allowed redirect URLs. Authorizing requires a Front admin.

Known gaps: the Channel API (partner channels, a separate spec) is not included. Front also has a beta MCP server at https://mcp.frontapp.com/mcp (OAuth, user-scoped); it is not mounted because the Core API covers more.
