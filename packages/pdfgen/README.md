# PDFgen

Generate PDFs with [PDFgen](https://pdfgen.com) from a saved template, raw HTML (Handlebars), Markdown or a plain-English AI prompt, and manage templates, account usage and API logs. Tools: `account`, `generate`, `templates.{list,get,create,update,delete}`, `logs`.

## Interface

Hand-written tools over PDFgen's REST API (`https://pdfgen.com/api/v1`, documented at https://pdfgen.com/docs). PDFgen publishes no OpenAPI document, and its official MCP server (`@pdfgen/mcp`) is a local npm stdio package, not a remote server, so it cannot be mounted. `generate` always requests `export_type: "url"` and returns a signed download link.

## Auth

API key (`Authorization: Bearer`). Create one on the Developer page of the PDFgen app (https://pdfgen.com/developer); a paid plan is required to get a key. There is no OAuth. Connection health calls `GET /me`, which does not use PDF credits.

Generating a PDF costs credits (AI prompts cost double), so `generate` and every template mutation require approval.

## Known gaps

- Raw PDF download (`export_type: "file"`) and `self_storage` are not exposed; only signed URLs are returned.
- Response shapes are passed through unvalidated.
