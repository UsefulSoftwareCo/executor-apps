# ScrapeGraphAI

AI-powered web data extraction: scrape pages into markdown, HTML or JSON, run natural-language structured extraction, web search with page content, async multi-page crawls, scheduled monitors with change detection, and credits and request history (about 20 tools).

Interface: the official hosted remote MCP server at https://mcp.scrapegraphai.com/mcp (Streamable HTTP), documented at https://docs.scrapegraphai.com/services/mcp-server/introduction. ScrapeGraphAI publishes no public OpenAPI document for its v2 REST API (v2-api.scrapegraphai.com) and the old v1 host is deprecated, so MCP is the broadest official interface. Mutating tools require approval; tools marked read-only do not.

Auth:
- API key: create one in the dashboard at https://scrapegraphai.com/dashboard. It is sent as a bearer token to the MCP server.
- OAuth: the server supports OAuth 2.1 with dynamic client registration and PKCE (scope `mcp:use`, discovered from the server). Sign-in is through Google. Executor registers its own client, so no OAuth app needs to be created; allow Executor's redirect URI when prompted.

Known gaps: individual tool calls are capped at 60 seconds by the server, so long jobs must use the async crawl and monitor tools. Tools are discovered live from the server, so the count can change.
