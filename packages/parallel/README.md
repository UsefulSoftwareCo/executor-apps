# Parallel

Parallel's web research APIs for agents: web and image search, page extraction, deep research Tasks and task groups, FindAll entity discovery, monitors and memory.

Interface: OpenAPI, from Parallel's own public document at https://docs.parallel.ai/public-openapi.json (server https://api.parallel.ai). 31 of the spec's 37 operations are exposed as tools. Every mutation (any non-GET operation) requires approval on every call. This deliberately includes the read-only POST operations (`/v1/search`, `/v1/extract`, `/v1/images/search`, `/v1beta/memory/retrieve`, `/v1beta/findall/entity-search`), because approval follows the HTTP method; this is the conservative choice and is accepted.

Auth: API key only. Create one in the Parallel platform at https://platform.parallel.ai (API keys); it is sent as the `x-api-key` header. The separate Search MCP server (https://search-mcp.parallel.ai/mcp) uses OAuth and is not mounted, since the OpenAPI covers search and extract.

Known gaps: six operations are not exposed as tools. The compiler drops them silently (it reports 0 skipped) because their responses are, or may be, `text/event-stream`, which a request/response tool cannot return:
- `GET /v1/tasks/groups/{taskgroup_id}/events` (SSE)
- `GET /v1/tasks/groups/{taskgroup_id}/runs` (SSE)
- `GET /v1/tasks/runs/{run_id}/events` (SSE)
- `GET /v1beta/findall/runs/{findall_id}/events` (SSE)
- `POST /v1/responses` (JSON, or SSE when `stream=true`)
- `POST /v1beta/chat/completions` (JSON, or SSE when `stream=true`)

Poll task, task group and FindAll run results with the corresponding non-streaming result/get tools instead. The OpenAI-style responses and chat completions endpoints are not covered.
