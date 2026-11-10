# Carbone

Document generation and conversion with [Carbone](https://carbone.io): upload and manage templates (DOCX, XLSX, PPTX, ODT, HTML, Markdown), render them with JSON data to PDF and other formats, convert documents, download generated files and check API status. 11 tools.

**Interface:** OpenAPI, from Carbone's official specification at https://carbone.io/file/carbone.OpenAPI.yml (also published in the official `carboneio/carbone-mcp` repository). Carbone also runs an official remote MCP server at https://mcp.carbone.io, but the OpenAPI covers the full API, so the OpenAPI is used. Mutations (upload, patch, delete templates, render) require approval.

**Auth:** API key only (Bearer token). Carbone has no user-created OAuth apps. Copy the `production` or `test` key from https://account.carbone.io. The package pins `carbone-version: 5` on every call (the header is optional in tool input and defaults to 5).

**Known gaps:** Carbone Cloud only (`api.carbone.io`); on-premise and Docker servers on other hosts are not supported. Rendering is two steps: the render tools (`POST /render/{templateId}`, `POST /render/template`) return JSON containing a `renderId`, and `GET /render/{renderId}` returns the generated file bytes as a binary result (`openapiBinaryResultSchema`; the `download` query flag only changes Content-Disposition). Template download (`GET /template/{id}`) is also binary. The render and download calls are unverified against a live account: `scripts/check.sh` only typechecks, compiles and deploys, and no Carbone API key was available for a test render.
