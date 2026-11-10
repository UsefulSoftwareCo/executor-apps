# Mem

Tools for Mem (https://mem.ai): notes, collections, search, related notes, mem it, plus the calendar, tasks, events and sessions endpoints the API publishes.

Interface: Mem's official OpenAPI document, https://docs.mem.ai/api-reference/openapi.json, loaded live against https://api.mem.ai (65 tools, 39 of them classed as mutations, which includes read-style POST routes such as searches; every mutation asks for approval). The document also lists legacy `/v0` and `/v1` routes, `/v2/mcp/*` helper routes and calendar-connection routes; they are exposed as published.

Auth: API key (bearer token). Create one in Mem under Settings, API, then paste it when connecting the account. The health check lists one collection.

Known gaps: Mem's hosted MCP server (https://mcp.mem.ai/mcp) uses OAuth with dynamic client registration only, so the metadata advertises only dynamic client registration and users cannot create their own OAuth app; it is not mounted because the REST API covers the same notes and collections operations.
