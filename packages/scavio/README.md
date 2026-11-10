# Scavio

Real-time search API for agents: structured JSON from Google (search, maps, news, shopping, flights, hotels), YouTube, TikTok, Instagram, X, retail, real estate, jobs, app stores and more, plus Extract (read any URL as Markdown, map, crawl, batch, screenshot).

**Interface:** Scavio's official remote MCP server, `https://mcp.scavio.dev/mcp` (docs: https://scavio.dev/docs/mcp-server). Scavio's REST API reference (https://scavio.dev/docs/api-reference) links no OpenAPI document and the usual spec URLs return 404, so the MCP server is the interface with the most tools. Tools are discovered live from the server. Tools without `readOnlyHint` require approval.

**Auth**
- API key: create one at https://dashboard.scavio.dev (50 free signup credits). Sent in the `x-api-key` header, as the vendor's MCP docs specify. (Scavio's REST API at `api.scavio.dev`, which this package does not use, takes `Authorization: Bearer sk_...` instead; the MCP docs do not mention Bearer.)
- OAuth: the server supports OAuth with dynamic client registration (metadata discovered from `https://mcp.scavio.dev`); no OAuth app needs to be created by hand. Executor's OAuth callback URL is registered automatically.

**Known gaps:** the server loads a default subset of its tools (107 of 229, as stated in the vendor docs; counts may drift); credits are consumed per call by Scavio.
