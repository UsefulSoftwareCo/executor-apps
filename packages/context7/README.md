# Context7

Look up up-to-date, version-specific library documentation and manage Context7 libraries: search libraries, fetch documentation context, add repositories, websites, llms.txt, OpenAPI specs, Notion, Confluence and file uploads, refresh libraries, and check usage and policies.

**Interface:** OpenAPI, from Context7's official document at https://context7.com/openapi.json (server `https://context7.com/api`). Context7 also has a hosted MCP server (`https://mcp.context7.com/mcp`, OAuth); it is not mounted because the REST API covers its search and docs tools and more.

**Auth:** API key. Create one at https://context7.com/dashboard; it is sent as a bearer token. The health check calls `GET /v2/usage`. Context7 offers no user-created OAuth apps for the REST API.

**Approvals:** every mutating operation (adding or refreshing libraries) requires approval.

**Known gaps:** none known; operations follow the published spec.
