# AgentQL

Extract structured data from web pages with AgentQL queries or natural-language prompts, create remote browser sessions (Tetra), and read account and session usage.

**Interface:** AgentQL's official OpenAPI document, https://api.agentql.com/openapi.json, served from `https://api.agentql.com`. The spec publishes every operation under both `/v1/...` and unversioned paths; the vendor docs only document `/v1`, so the unversioned duplicates are removed (patched out in `openapi.ts`). That leaves 4 OpenAPI tools: `query-data`, `usage`, `tetra/sessions` (create) and `tetra/usage`. The documented `POST /v1/query-document` (multipart PDF/image extraction) is missing from the official spec, so it is a hand-written tool, `documents.queryDocument`, taking the file as base64. Total: 5 tools.

**Auth:** API key only, sent in the `X-API-Key` header. Create one in the AgentQL Dev Portal at dev.agentql.com. AgentQL has no OAuth for its REST API, so no OAuth app is declared. The health check calls `GET /v1/usage`.

**Approvals:** query-data, session creation and query-document are POSTs, so they are treated as mutations and ask for approval.

**Known gaps:** only the endpoints in the official spec plus `query-document` are covered; remote browser sessions are driven over the CDP URL returned by session creation, which is outside this API.
