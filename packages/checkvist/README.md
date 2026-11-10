# Checkvist

Manage Checkvist outlines: checklists, tasks (list items) with nesting, tags, due dates, priorities, repeats, status changes, imports and notes.

**Interface:** Checkvist's official OpenAPI document, https://checkvist.com/openapi.yaml (21 tools). Checkvist also runs an official remote MCP server at https://checkvist.com/mcp, but it is a PRO-only feature and its OAuth flow uses dynamic client registration only, so the REST API is used instead and works on every plan.

**Auth:** API key. Provide your account email and your Remote API key (Checkvist > Profile > Remote API key), sent as HTTP Basic. OAuth is not offered: Checkvist's MCP OAuth uses dynamic client registration only, and no user-created OAuth app flow is documented.

**Gaps:** Login/token endpoints are included but unnecessary with Basic auth. The MCP server's additional capabilities are not mounted.
