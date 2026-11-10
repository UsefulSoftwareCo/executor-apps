# Convex

Manage Convex through its Management API: teams, members, projects, deployments, deploy keys, custom domains, default environment variables, access tokens, custom roles and audit logs.

Interface: OpenAPI, loaded live from the official document at https://api.convex.dev/v1/openapi.json (API base https://api.convex.dev/v1). It covers the Management API only, not the data-plane (query/mutation/function) APIs of a deployment, which live on per-deployment hosts.

Auth:
- Access token (`apiKey`): a personal access token (dashboard, user settings), a team token (dashboard, team settings) or a preview deploy key. Sent as a bearer token.
- OAuth (`oauth`): create an OAuth app in the Convex dashboard under Team Settings, Applications, OAuth Apps, and register the Executor redirect URI shown on the connect page. This package uses the team authorize endpoint (https://dashboard.convex.dev/oauth/authorize/team) and the token endpoint https://api.convex.dev/oauth/token with client secret in the body. Convex has no scope parameter; the team endpoint yields a team token. Unverified OAuth apps are limited to 100 teams.

Known gaps: project-scoped OAuth tokens are not offered (only the team authorize endpoint); mutations require approval.
