# CustomJS

Run JavaScript with NPM modules, convert HTML or Markdown to PDF, capture screenshots and scrape websites with [CustomJS](https://www.customjs.space).

**Interface:** CustomJS's official remote MCP server, `https://mcp.customjs.space/customjs/mcp` ([docs](https://www.customjs.space/integration/mcp/)). CustomJS publishes no OpenAPI document, so the tool list is whatever the server advertises (the docs describe PDF generation, screenshots, scraping and JavaScript execution; `tools/list` requires auth so the exact set was not enumerated). Tools that are not read-only require approval.

**Auth**
- API key: create one at [app.customjs.space](https://app.customjs.space); sent as the `x-api-key` header.
- OAuth: the server publishes OAuth metadata with dynamic client registration, so no OAuth app needs creating. Executor's redirect URI is registered automatically. This comes from the server's live metadata (confirmed by `mcp-probe`); the vendor's MCP docs only describe the `x-api-key` header and never mention OAuth. Use the API key if OAuth does not work for your account.

**Known gaps:** The REST API (`e.customjs.io`, including saved functions called by ID) is not mounted. The MCP server does not advertise it. The icon is an unverified redraw: CustomJS publishes no SVG or PNG of 128px or more (its brand assets are a 50px favicon, also used by app.customjs.space, and the GitHub org avatar is a generated identicon), so the indigo `{ }` braces in that favicon were redrawn as SVG. Replace it if the vendor supplies an official asset.
