# Mermaid Chart

Validates and renders Mermaid diagrams (SVG), generates diagram titles and summaries, and manages a Mermaid Chart account's projects and diagrams, through Mermaid Chart's official remote MCP server.

Interface: remote MCP server at https://mcp.mermaid.ai/mcp (docs: https://mermaid.ai/docs/ai/mcp-server). Tools are discovered from the server at runtime. The documented set is nine tools: `validate_and_render_mermaid_diagram`, `get_diagram_title`, `get_diagram_summary`, `list_tools`, `list_mermaid_chart_projects`, `list_mermaid_chart_diagrams`, `create_mermaid_chart_diagram`, `get_mermaid_chart_diagram` and `update_mermaid_chart_diagram`.

Auth, two methods:
- API token: generate a token in your Mermaid account settings (a free Basic account is enough). It is sent as `Authorization: <token>` with no `Bearer` prefix, as the vendor docs show.
- OAuth 2.0: the server publishes protected-resource and authorization-server metadata (Supabase auth, scope `email`) with dynamic client registration, so no OAuth app needs to be created. Executor's redirect URI is registered automatically. OAuth tokens are sent as `Authorization: Bearer <access_token>`.

Approvals: every tool without `readOnlyHint` requires approval, so create and update tools are always gated. Servers can omit annotations, in which case read-only tools are gated too (safe, only noisier); confirm the annotations at runtime.

Known gaps: the interactive preview UI the server advertises is not shown in Executor. Mermaid Chart's separate REST API is not mounted; project and diagram management is available through the MCP tools.
