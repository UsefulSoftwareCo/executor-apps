# LeadMagic

B2B data enrichment: email finding and validation, mobile numbers, profile and company enrichment, job and advertising search, analytics and credits.

Interface: OpenAPI, LeadMagic's official document at https://leadmagic.io/openapi.json (about 90 operations on https://api.leadmagic.io). LeadMagic also runs a hosted MCP server (https://mcp.leadmagic.io/mcp, OAuth with scope mcp_all, composite workflow tools); its tool count could not be verified without an OAuth session, so the OpenAPI is used as the official, directly inspectable interface.

Auth: API key only (sent as `X-API-Key`). Create one at https://app.leadmagic.io/settings/api. LeadMagic has no user-created OAuth apps for the REST API. Every mutation (including credit-consuming enrichment calls) requires approval.

Known gaps: the spec has 90 operations but the package exposes 89 tools. `GET /bulk/jobs/{jobId}/stream` (bulk-job-stream) returns `text/event-stream`, which the OpenAPI runtime does not expose as a tool; use the bulk job status endpoints instead. The health check calls `GET /v1/credits`.
