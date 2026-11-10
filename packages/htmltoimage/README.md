# HTML to Image

Renders HTML and CSS, public URLs and saved templates into PNG images or PDFs with [html2img](https://html2img.com) (the "HTML to Image" product), and reads the account's plan and remaining credits. Tools: render HTML, screenshot a URL, render a template by slug, get account status, and ping.

Interface: OpenAPI, the vendor's official document at https://html2img.com/openapi.json (server `https://app.html2img.com/api`). All render operations are mutations and ask for approval, since each spends a credit.

Auth: API key only. Create one at https://app.html2img.com/api-keys (keys start with `htim_`); it is sent in the `X-API-Key` header. html2img offers no OAuth.

Known gaps: html2img also ships a remote MCP server (`https://app.html2img.com/mcp`, paid plans, Bearer API key); it is not mounted because the OpenAPI tools cover the same API. This is the html2img.com service, not HTML/CSS to Image (htmlcsstoimage.com).
