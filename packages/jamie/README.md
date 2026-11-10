# Jamie

Jamie AI meeting notes: summaries, transcripts, tasks, tags and templates, usable by agents (8 tools).

**Interface:** Jamie's official remote MCP server at `https://mcp.meetjamie.ai/mcp` (probe verdict: `oauth`). Tools per Jamie's docs: `list_meetings`, `get_meeting`, `search_meetings`, `list_tasks`, `create_tasks`, `list_tags`, `list_templates`, `upsert_template`. Tools not annotated read-only require approval. Jamie also has an official REST API (`https://beta-api.meetjamie.ai`, docs at `https://docs.meetjamie.ai/developers/api/api`) with a tRPC-style `?input={"json":...}` query format and no published OpenAPI document; it adds meeting deletion and task update, and needs a Pro, Team or Enterprise plan. It is not wrapped here.

**Auth:** OAuth 2.0 with PKCE (S256) and dynamic client registration, discovered from the server's metadata (`oauth2({ discover })`; authorization server `https://mcp.meetjamie.ai`). Sign in with your Jamie account when you connect; no API key is needed. The REST API key (`x-api-key: jk_...`, created in Settings > Developers > API Keys, per the vendor docs) is not used by this package.

**Gaps:** No meeting delete or task update (REST only). A full OAuth connect was not tested end to end.

**Icon:** Jamie's official 512px app icon from `https://www.meetjamie.ai/favicon.png`; Simple Icons has no Jamie entry.
