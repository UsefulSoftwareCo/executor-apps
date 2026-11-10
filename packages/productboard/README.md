# Productboard

Productboard REST API v2 as 58 tools: entities (features, subfeatures, components, products, initiatives, objectives, key results, releases and release groups) with their relationships and custom field values, customer feedback notes and their links, companies and users, members, teams, webhooks, Jira and plugin integrations, customer scores and analytics. Searches are read-only; every other write asks for approval.

**Interface:** OpenAPI. Productboard publishes one official OpenAPI 3.1 document per API area at `https://developer.productboard.com/v2.0.0/openapi/<name>.yaml` (also bundled in https://github.com/productboard/pb-api/releases). The developer portal sits behind a Cloudflare bot challenge that blocks automated fetches, so the nine documents are vendored unmodified as `*.openapi.json` and mounted under one router key each (`entities`, `notes`, `members`, `teams`, `webhooks`, `jiraIntegrations`, `pluginIntegrations`, `customerScores`, `analytics`). Refresh them from the release bundle when Productboard ships changes.

**Auth**

- API access token: in Productboard open Settings, Integrations, Public APIs, Access Token and add a token (Pro plan or higher). It is sent as `Authorization: Bearer`.
- OAuth 2.0 (authorization code): register an application at https://app.productboard.com/oauth2/applications and enter its client ID and secret on the connect page. Add the redirect URI shown by Executor to the application's registered redirect URIs; it must match exactly. Only makers with admin access can authorize the application. Per [Productboard's OAuth guide](https://developer.productboard.com/reference/oauth-authorization-code.md) the authorize request carries no `scope` parameter; permissions are chosen when the application is registered, so the package declares none. The guide's complete scope list is `entities:read|write|delete`, `notes:read|write|delete`, `analytics:read` and `members_pii:read` (unredacted member emails); enable the ones you need. The user's own role permissions still apply. Access tokens last 24 hours; refresh tokens last 180 days and rotate on use (the old one stays valid for 60 minutes), and the host refreshes them.

The OAuth endpoints (`/oauth2/authorize`, `/oauth2/token`, `/oauth2/revoke`) are confirmed by that guide, which also lists `client_id` and `client_secret` as parameters of the token request, hence `client_secret_post`. The vendored OpenAPI documents list `/oauth/...` URLs and a `write:entities` spelling; the guide is treated as authoritative.

**Known gaps**

- The OpenAPI documents require scopes that the OAuth guide's list does not contain (`members:read`, `teams:*`, `webhooks:*`, `jira-integrations:read`, `plugin-integrations:*`, `fields:write`). The guide does not say whether an OAuth app can be granted them, so the members, teams, webhooks, Jira, plugin integration tools and entity field-value writes may return 403 under OAuth. They work with an API access token.
- API v1 (the legacy `x-version: 1` API with features, products, releases and insights endpoints) has no published OpenAPI document and is not covered; v2 supersedes it.
- The SCIM API and the beta MCP server (`https://mcp.productboard.com`, OAuth with dynamic client registration) are not mounted.
- The server-to-server JWT OAuth flow is not offered.
