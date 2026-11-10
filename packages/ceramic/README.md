# Ceramic

Web search for LLMs and AI agents through the Ceramic Search API: one `search` tool that returns titles, URLs and descriptions for a query.

Interface: OpenAPI, the vendor's official document at https://docs.ceramic.ai/api-reference/openapi.json (server https://api.ceramic.ai). Ceramic also runs an MCP server at https://mcp.ceramic.ai/mcp, but it wraps the same single search operation, so the OpenAPI document is used.

Auth: API key (bearer token). Create one at https://platform.ceramic.ai/keys. New accounts get free credits. Ceramic has no OAuth.

Known gaps: the API has a single endpoint, so the provider has no health check (there is no read-only account endpoint). The icon is Ceramic's official 192px app icon, since the vendor publishes no SVG mark.
