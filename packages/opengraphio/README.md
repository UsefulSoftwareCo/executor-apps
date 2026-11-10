# OpenGraph.io

OpenGraph.io retrieves Open Graph data from websites, even those without proper tags, and also offers scraping, screenshots, structured extraction, AI page queries, oEmbed and page-to-markdown conversion. This package exposes whatever tools the vendor's hosted MCP server provides.

**Interface:** the official remote MCP server at `https://mcp.opengraph.io/mcp` (documented at https://www.opengraph.io/docs/mcp/claude-code). OpenGraph.io publishes no OpenAPI document for its REST API (https://www.opengraph.io/documentation), so MCP is the interface with the broadest coverage. Tool names are discovered from the server at runtime. MCP tools require approval unless the server marks them `readOnlyHint`.

**Auth:**
- App ID (`apiKey`): create or copy an App ID in the dashboard at https://dashboard.opengraph.io. It is sent as the `x-app-id` header to `mcp.opengraph.io` only, as the vendor documents.
- OAuth (`oauth`): the server advertises OAuth metadata (authorization server `https://dashboard-api.opengraph.io`, dynamic client registration, PKCE S256, scope `mcp`), so Executor discovers everything from the MCP URL. Sign in with your OpenGraph.io account; register the Executor callback URL if asked for a redirect URI.

**Known gaps:** the vendor does not publish the MCP tool list in its docs, so tools could not be enumerated without credentials; the health check only verifies the MCP handshake. The REST-only parameters are available only as far as the MCP tools expose them.
