# Webflow

Sites, CMS collections and items, pages, assets, forms, custom code, e-commerce (products, orders, inventory), comments, users, webhooks and site configuration through the Webflow Data API v2 (126 tools).

**Interface:** OpenAPI, loaded live from Webflow's official specification repository: https://raw.githubusercontent.com/webflow/openapi-spec/main/openapi/v2.yml (API base `https://api.webflow.com/v2`). Every mutation asks for approval.

## Auth

- **API token** (`token`): create a site token in Site settings > Apps & integrations > API access, or a workspace token in Workspace settings > Apps & integrations. Sent as a bearer token.
- **OAuth** (`oauth`): register a Data client app in Workspace settings > Apps & Integrations tab > App Development section, then enter its client ID and secret on the connect page. Add Executor's redirect URI to the app's redirect URIs. Authorization is `https://webflow.com/oauth/authorize`, the token exchange is `https://api.webflow.com/oauth/access_token` (JSON body, client credentials in the body), and scopes are space separated. The requested scopes cover sites, pages, CMS, assets, forms, custom code, e-commerce, components, comments, users, site configuration, site activity and workspace creation.

## Notes and gaps

- The spec lists only an OAuth2 scheme on each operation, although API tokens work as bearer tokens too; the package treats both as bearer so every tool works with either account type.
- Site tokens cannot call the custom code endpoints (about 10 operations such as get-site-custom-code, add-custom-code-tosite, post-hosted-script), and Webflow's scopes reference lists workspace activity (get-workspace-audit-logs) as workspace-level; with the token method these return 401/403. Use OAuth for custom code.
- `workspace_activity:read` and `workspace:read` are workspace-level scopes, available only to Data Client apps registered with workspace-level access and to workspace tokens. They are not requested, so get-workspace-audit-logs does not work over OAuth; use a workspace token. `workspace:write` (workspace creation) is requested and works only if the app has it enabled.
- The spec references `page:read`/`page:write` on some page operations, but Webflow's scopes reference defines only `pages:read`/`pages:write`; this is a spec inconsistency, and the package requests `pages:*`.
- Designer API, Browser API and Webflow's MCP server are not included; only the Data API.
- Webhook payload definitions in the spec are documentation only and produce no tools.
