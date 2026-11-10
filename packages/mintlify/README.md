# Mintlify

Manage Mintlify documentation sites: trigger deployments and previews, check update status, run workflows, start and message docs agent jobs, create static exports, and read analytics (feedback, searches, page views, visitors, assistant conversations).

**Interface:** OpenAPI. Four official documents published by Mintlify, all on `https://api.mintlify.com` with the admin API key, mounted under one router (20 REST tools, counted across the four documents):

- `admin`: https://www.mintlify.com/docs/admin-openapi.json (agent jobs, workflow webhooks)
- `project`: https://www.mintlify.com/docs/openapi.json (deployments, previews, update status, workflow trigger)
- `analytics`: https://www.mintlify.com/docs/analytics.openapi.json
- `staticExport`: https://www.mintlify.com/docs/static-export-openapi.json

**Auth:** Two methods.

- Admin API key (bearer token) for the four REST documents. Create it at https://app.mintlify.com/settings/organization/api-keys. Mintlify's REST API has no OAuth. Every mutation requires approval. There is no current-account endpoint, so the health check lists agent jobs for a placeholder project: 401 (rejected key) and 403 (no access) fail, 2xx and 404 for the placeholder project pass, anything else fails.
- OAuth to Mintlify's hosted admin MCP server at https://mcp.mintlify.com (documented at https://www.mintlify.com/docs/ai/mintlify-mcp), discovered from its RFC 9728/8414 metadata with dynamic client registration, so no OAuth app needs creating. It adds page, navigation and `docs.json` editing in checkout sessions. Requested scopes: docs:read, docs:write, nav:write, config:write, session:write, deployment:read, analytics:read, offline_access (members, billing, integrations and deployment writes are left out). MCP tools require approval unless read-only. An OAuth account exposes only the MCP tools; an API key account exposes only the REST tools.

**Known gaps:** The assistant API (`discovery-openapi.json`) and the Index API (`index-openapi.json`) use different keys (assistant key, `mint_us_` index key) and different hosts, and are not included.
