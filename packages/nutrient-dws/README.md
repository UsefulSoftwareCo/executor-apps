# Nutrient DWS

Nutrient Document Web Services (formerly PSPDFKit Processor API): build and assemble PDFs, convert Office documents and HTML to PDF, OCR, redact (including AI redaction), watermark, sign, Markdown to PDF, Office template processing, async jobs, account usage and JWT tokens.

**Interface:** OpenAPI 3.1, Nutrient's official DWS Processor API reference, https://www.nutrient.io/api/reference/public/openapi.yml (server `https://api.nutrient.io`). Nutrient also ships a local stdio MCP server (`@nutrient-sdk/dws-mcp-server`), which is not a remote server and is not used here.

**Auth:** API key (HTTP bearer). Create one in the Nutrient dashboard at https://dashboard.nutrient.io/api/api_keys/ (keys look like `pdf_live...`). The API has no user-created OAuth apps.

**Known gaps:** Operations that upload or return binary documents use multipart bodies and binary responses, so they suit small files best. Health checks call `GET /account/processor/usage`, the non-deprecated replacement for `/account/info`.
