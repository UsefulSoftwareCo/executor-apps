# DocsAutomator

Generate PDFs and Google Docs from templates (Google Docs, Word or PDF), manage automations and template placeholders, check job and queue status, and run e-signature sessions in DocsAutomator.

**Interface:** two surfaces, mounted under separate keys. `rest` is DocsAutomator's official OpenAPI document at https://docsautomator.co/docs/openapi.json (18 operations, API host `https://api.docsautomator.co`). `mcp` is the official remote MCP server at https://mcp.docsautomator.co/mcp (18 tools, Streamable HTTP). They are different surfaces, not subsets: the MCP adds Word template generation and editing, placeholder and line-item configuration, record-source (data source) get/set, output configuration, search and recent runs, which the REST API does not expose.

**Auth:**
- API key (`apiKey`), sent as `Authorization: Bearer <key>` to both the REST API and the MCP server. Create it in the workspace settings at https://app.docsautomator.co/settings/workspace/api. Keys are scoped to a workspace. Accounts using it get both `rest` and `mcp` tools.
- OAuth (`oauth`), via the MCP server's metadata (authorization server `https://api.docsautomator.co`, dynamic client registration, public client with PKCE S256, scopes `docsautomator:read` and `docsautomator:write`). No OAuth app needs to be created by hand. The vendor does not document that the REST API accepts these tokens, so OAuth accounts get only the `mcp` tools. Register the Executor callback URL shown on the connect page as the redirect URI if the server asks for it.

**Icon:** DocsAutomator's official 256px app icon (`webclip.png` from docsautomator.co); the vendor publishes no SVG and Simple Icons has no entry.

**Gaps:** All mutations (REST) and all MCP tools without `readOnlyHint` require approval. Record-source accounts such as Airtable and Notion are connected in the DocsAutomator app (Settings, Integrations), not through this package.
