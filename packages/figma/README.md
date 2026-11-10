# Figma

Design files and nodes, image export, comments and reactions, components, component sets and styles, projects and team libraries, dev resources, webhooks, library analytics and variables, from the Figma REST API.

**Interface:** OpenAPI, from Figma's official spec at https://raw.githubusercontent.com/figma/rest-api-spec/main/openapi/openapi.yaml (50 tools, 11 mutations; mutations require approval). Four operations are skipped because they declare no auth method this package can supply (the Activity Logs and Discovery APIs, which need an OAuth app with special scopes).

## Auth

- **Personal or plan access token** (`token`): create one in Figma under Settings > Security > Personal access tokens (plan access tokens are for Organization and Enterprise plans). Sent as the `X-Figma-Token` header.
- **OAuth** (`oauth`): create an OAuth app at https://www.figma.com/developers/apps and paste its client ID and secret on the connect page. Register the Executor callback URL shown on the connect page as a redirect URL on the app. Token exchange uses HTTP Basic client authentication; scopes are comma separated. Tokens are sent as a bearer header.

## Known gaps

- Variables endpoints need an Enterprise plan and the `file_variables:*` scopes, which are not requested by default. Library analytics needs `library_analytics:read`; add scopes to the OAuth app if you need them.
- The spec lists the deprecated, very permissive `files:read` scope alongside the granular scope on 23 read operations, and `projects:read` / `project_metadata:read` (renamed `folders:read` / `folder_metadata:read`) on a few more. This package requests the granular scopes plus `folders:read` and `folder_metadata:read`, but deliberately not `files:read`. Figma's scopes page describes `files:read` as a broad legacy alternative to the granular scopes, not an extra requirement, so those operations should work without it; this has not been verified against a live OAuth connection. If an operation is rejected for a missing scope under OAuth, add `files:read` to the OAuth app and the provider scopes, or use a personal access token.
- Figma refreshes tokens at a separate endpoint, `POST https://api.figma.com/v1/oauth/refresh`, which the framework's OAuth config cannot call, so refresh is unsupported. Re-authorize the connection when the access token expires (about 90 days).
- The SCIM API (tenant-scoped, separate host) and Figma's remote MCP server are not included.
