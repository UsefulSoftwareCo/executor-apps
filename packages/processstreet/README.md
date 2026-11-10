# Process Street

Covers the Process Street Public API: workflows and revisions, workflow runs, tasks, form field values, assignees, approvals, comments, attachments and file uploads, folders, permissions and data set incoming webhooks (150 operations).

Interface: OpenAPI, loaded live from Process Street's official document at https://public-api.process.st/api/v1.1/docs/docs.yaml. Mutations require approval.

Auth: API key. Create one in Process Street under Settings > Integrations > API keys (admin access is required) and paste it into the connection; it is sent as the `X-API-Key` header to `public-api.process.st`. Process Street's API has no user-created OAuth apps. Its MCP server (https://mcp.process.st) uses OAuth with dynamic client registration and is not mounted here because the REST API is a superset.

Known gaps: the API exposes no current-user endpoint, so the connection health check lists workflows.
