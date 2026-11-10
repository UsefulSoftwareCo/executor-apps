# You.com

Real-time web intelligence for agents from You.com: web and news search, page content extraction, cited answers, deep research tasks, finance research, image search and account balance.

**Interface:** OpenAPI. You.com publishes seven official specs (index at https://you.com/docs/openapi.json, each at `https://you.com/docs/openapi/<name>.json`: web-search, contents, answer, research, finance-research, billing, images). They are mounted under one router, one key per spec. Search and Contents are served from `ydc-index.io`, the rest from `api.you.com`, so each spec is pinned to its own origin and both hosts are declared on the provider. Search and Contents are POST but read-only, so they run without approval; Answer, Research and Finance Research start paid jobs and ask for approval.

**Auth:** API key, sent as the `X-API-Key` header. Create one at https://you.com/platform (free credits on signup). You.com's hosted MCP server (`https://api.you.com/mcp`) also supports OAuth, but it exposes a subset of the same capabilities, so it is not mounted here.

**Known gaps:** the SSE research stream endpoint (`GET /v1/research/{task_id}/stream`) is not exposed as a tool; poll `research.getResearchTask` instead. Total: 8 tools.
