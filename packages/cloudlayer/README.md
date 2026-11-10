# Cloudlayer

Generate PDFs and images from URLs, HTML and templates with [cloudlayer.io](https://cloudlayer.io), convert DOCX and PDF files (DOCX to PDF, DOCX to HTML, PDF to DOCX), merge PDFs, and manage jobs, assets, storage destinations and templates.

**Interface:** cloudlayer.io's official remote MCP server at `https://mcp.cloudlayer.io/mcp` (HTTP transport, 23 tools), documented at https://cloudlayer.io/docs/mcp-setup/. The tool list comes from the server at runtime. `node scripts/mcp-probe.ts` reports an OAuth challenge with protected-resource metadata and a registration endpoint.

**Auth:** OAuth 2.0 with dynamic client registration and S256 PKCE, discovered from `https://mcp.cloudlayer.io`. Connecting opens the cloudlayer.io authorization page; there is nothing to create beforehand. The server advertises no scopes. Tools that are not marked read-only require approval.

**REST API not included:** cloudlayer.io also has a REST API (`https://api.cloudlayer.io/v2`, `X-API-Key` header, key from the dashboard). It was dropped because the MCP server is a superset: it covers every REST operation the earlier hand-written package exposed, plus the file conversions. An API-key method is not offered.

**Known gaps:** the vendor's jobs and assets list endpoints return only the 10 newest items and have no pagination, so older jobs and assets must be fetched by id. The OAuth flow was not exercised against a live account.
