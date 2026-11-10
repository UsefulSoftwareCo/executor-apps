# Tavily

Search the web, extract page content, crawl and map sites, run cited research, and read usage and logs with Tavily's search API built for AI agents.

**Interface:** Tavily's official OpenAPI document, https://docs.tavily.com/documentation/api-reference/openapi.json, served from `https://api.tavily.com`. This yields 9 tools (search, extract, crawl, map, createResearch, getResearch, feedback, getUsage, logs). Tavily's official remote MCP server (`https://mcp.tavily.com/mcp/`) was probed but exposes fewer capabilities, so the OpenAPI is used.

**Auth:** API key only (sent as a Bearer token). Create one in the Tavily dashboard at https://app.tavily.com. Tavily's OAuth is offered only for its MCP server and CLI, not the REST API, so no OAuth app is declared.

**Approvals:** Tavily's endpoints are POST, so search, extract, crawl and map are treated as mutations and ask for approval.

**Known gaps:** `/org-usage` is skipped because it requires the organization owner's personal key (a second bearer scheme). The spec uses `servers: https://api.tavily.com/` only, so no `multiple_hosts` skips.
