# Todoist

Tasks, projects, sections, labels, comments, reminders, filters, workspaces, activity and completed-task queries from the Todoist API v1.

**Interface:** OpenAPI. Todoist's own document at https://developer.todoist.com/openapi.json (official, 3.1). It declares no security schemes, so the package supplies a bearer scheme. All operations are on https://api.todoist.com.

**Auth**
- API token (`token`): copy it from Todoist Settings > Integrations > Developer.
- OAuth 2.0 (`oauth`): create an app in the Todoist App Management console (https://app.todoist.com/app/settings/integrations/app-management) and enter its client ID and secret on the connect page. Add Executor's redirect URI to the app's OAuth redirect URL. Todoist publishes no discovery metadata, so endpoints are declared explicitly; scopes `data:read_write`, `data:delete`, `project:delete` are comma separated. The authorize URL is on `app.todoist.com` (no secrets pass there, so it is not in `hosts`); the token URL is on `api.todoist.com`. `project:delete` is a destructive scope, requested because the generated project-delete tools need it. New Todoist apps issue 1-hour access tokens with a rotating refresh token, which Executor renews before expiry (per the app-authoring accounts docs). Legacy apps get a 10-year token with no refresh token and cannot refresh unless they opt in through the App Management Console; use a new app.

Mutations require approval.

**Known gaps:** the `/sync` API is not in the official OpenAPI document and is therefore not exposed. Todoist's official remote MCP server (https://ai.todoist.net/mcp) was not used because the OpenAPI covers more operations.
