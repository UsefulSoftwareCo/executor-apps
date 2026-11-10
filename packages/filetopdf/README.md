# FileToPDF.dev

Converts documents (Word, Excel, PowerPoint, images and other formats at a public URL), HTML and Markdown to PDF, and reports plan and remaining credits.

**Interface:** FileToPDF's official hosted MCP server, `https://api.filetopdf.dev/mcp` (Streamable HTTP; tools `convert_file`, `convert_html`, `convert_markdown`, `get_account`). The vendor publishes no OpenAPI document. Docs: https://filetopdf.dev/documentation and https://github.com/FileToPDF/filetopdf-mcp.

**Auth:** API key only, sent as the `x-api-key` header. Get a free key (10 conversions, no signup) at https://filetopdf.dev. The server has no OAuth. Conversion tools are approval-gated because they spend credits.

**Known gaps:** Tool results return the PDF as a base64 resource. Layout options (landscape, paper size, margins, PDF/A, passwords) need a Pro, Scale or trial plan. Tool count (4) is from the vendor README, not a live `tools/list`, which needs a key.
