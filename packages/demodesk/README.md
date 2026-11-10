# Demodesk

Covers the Demodesk public API v2: the current user, users, recordings, transcripts (single and batch), AI summaries and scorecards.

Interface: OpenAPI, compiled live from Demodesk's official document at https://demodesk.com/api/docs/v2/generated.yaml (docs: https://demodesk.com/api/docs/index.html). The deprecated v1 API (3 endpoints) is not included.

Auth: API key only. An admin creates it under Settings > Integrations > Other in Demodesk; it is sent as a Bearer token and inherits the permissions of the user who created it (use an admin key to see company-wide data). Demodesk's official MCP server (https://demodesk.com/mcp) uses OAuth with dynamic client registration only, so there is no user-created OAuth app flow here.

Known gaps: v1-only endpoints (externally recorded demos) are missing; no webhook management in v2.
