# Railway

Projects, services, deployments, environments, variables, domains, volumes, logs and the rest of Railway's public API.

Interface: GraphQL at `https://backboard.railway.com/graphql/v2` (Railway's official public API; schema read by introspection, which the endpoint serves without credentials). Railway's hosted MCP server (`https://mcp.railway.com`) exposes only a curated subset, so the GraphQL API is used instead. Docs: https://docs.railway.com/reference/public-api

Auth:

- Account token (`apiKey`): create at https://railway.com/account/tokens with "No workspace" selected. Sent as `Authorization: Bearer`.
- Workspace token: create at the same page with a workspace chosen. Sent as `Authorization: Bearer`.
- Project token: create in a project's Settings, Tokens. Scoped to one environment of one project, sent as `Project-Access-Token`.
- OAuth: create an OAuth app in your workspace's Developer settings (https://docs.railway.com/integrations/oauth/creating-an-app) and enter its client ID and secret on the connect page; add Executor's redirect URI to the app. Endpoints come from Railway's OIDC discovery document. Requests `offline_access` (with `prompt=consent`) for refresh tokens, plus `workspace:member` and `project:member`; the user picks which workspaces and projects to share. Sends no RFC 8707 `resource`: Railway's protected-resource metadata names `https://backboard.railway.com`, but its token endpoint refuses that value with `invalid_target`, and Railway's OAuth docs send none.

Mutations require approval.

Known gaps: the `me` query works only with account tokens, and project tokens can reach only their own project and environment, so many tools will fail for narrow tokens. Workspace health checks use the token's workspace as the account identity.
