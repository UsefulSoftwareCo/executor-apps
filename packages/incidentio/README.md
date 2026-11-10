# incident.io

Incidents, alerts and alert sources, on-call schedules and escalation paths, catalog types and entries, custom fields, workflows, status pages, follow-ups, actions, users, roles and severities on incident.io.

Interface: incident.io's official OpenAPI 3.0 document, `https://api.incident.io/v1/openapiV3.json` (linked from https://docs.incident.io/api-reference/introduction). It covers the v1, v2 and v3 endpoints on `api.incident.io`: 329 tools, 182 of them mutations (each needs approval), none skipped. incident.io also runs a hosted MCP server at `https://mcp.incident.io/mcp`; its tool count was not checked (it requires an account), and OpenAPI was chosen because it is the complete documented API. That MCP server authenticates with OAuth and dynamic client registration; this is a separate surface that this package does not use.

Auth: API key only. Create one at https://app.incident.io/~/settings/api-keys (Settings > API keys), choosing the permissions it needs (account-level, team-scoped or both). The key is sent as `Authorization: Bearer <key>`. A user API key also works to act with your own permissions. The REST API documents only API keys and no OAuth flow, so this package has no OAuth method. The health check calls `GET /v1/identity`.

Known gaps: four operations in the spec override the global bearer auth with no security: `GET /v1/ip_ranges`, `GET /v1/openapiV3.json`, and the inbound endpoints `POST /v2/alert_events/http/{alert_source_config_id}` and `POST /v2/heartbeat/{alert_source_config_id}/ping`. All are on `api.incident.io`; the two POSTs are mutations and need approval. Otherwise none known. The spec is fetched live, so new endpoints appear as incident.io publishes them.
