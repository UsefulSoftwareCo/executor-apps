# Mem0

Covers the Mem0 platform API: adding, searching, updating and deleting memories (v1, v2 and v3 endpoints), entities and profiles, events, exports, batch operations, webhooks, and organization, project and member management.

Interface: OpenAPI. Mem0's official document at https://docs.mem0.ai/openapi.json (server `https://api.mem0.ai`). Every mutation requires approval.

Auth: API key. Create one in the Mem0 dashboard (https://app.mem0.ai, Settings, API Keys). It is sent as `Authorization: Token <key>`. The health check calls `GET /v1/ping/`.

Known gaps: Mem0's cloud MCP server (https://mcp.mem0.ai/mcp) is OAuth-only and not mounted, since the REST API is a superset. The self-hosted open-source server is not covered. No OAuth app support (Mem0 offers none for user-created apps).

Spec quirk: the vendor's OpenAPI marks the V3 operations (`POST /v3/memories/`, `/v3/memories/add/`, `/v3/memories/search/`) with `security: [{tokenAuth: []}]` but never declares `tokenAuth` in `components.securitySchemes`. `openapi.ts` declares it locally as the same `Authorization` header scheme with the `Token ` prefix, so all 68 operations compile (0 skipped).
