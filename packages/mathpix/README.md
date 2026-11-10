# Mathpix

OCR for math, text, tables and chemistry with Mathpix: single-image recognition (`/v3/text`), handwritten
strokes (`/v3/strokes`), asynchronous PDF and document processing (`/v3/pdf`), Mathpix Markdown conversion
(`/v3/converter`), the async Files API and batch jobs (`/files/v1/*`), stored result history and usage counts.

Interface: hand-written tools over the documented REST API (https://docs.mathpix.com). Mathpix publishes no
official OpenAPI document, GraphQL API or MCP server (the OpenAPI files on GitHub are third-party and unused here).
Everything goes to `api.mathpix.com`. Every POST or DELETE tool requires approval, including image and stroke OCR: those calls consume OCR credits and
Mathpix stores their results unless `improve_mathpix` is false.

Auth: API key only (`apiKey`), with two fields: app ID and app key. Create them in the Mathpix console at
https://console.mathpix.com (API keys). Every request sends the `app_id` and `app_key` headers. Mathpix has no OAuth.
The short-lived `app_token` feature is not exposed.

Known gaps:
- Downloads return text only (mmd, md, html, lines.json); binary outputs (docx, pptx, xlsx, pdf, zip) cannot be returned
  through a tool, so use the Files API or converter webhooks and your own storage for those.
- The EU host (`eu.api.mathpix.com`) is not supported; the package always uses `api.mathpix.com`.
- Multipart file upload, the SSE page stream, the legacy `/v3/batch` and `/v3/latex` endpoints, data-source and webhook
  management are not exposed. The health check lists one stored PDF result (`/v3/pdf-results`).
- Not exercised with a live key.
- Downloads treat HTTP 202 as not ready. HTTP 404 counts as not ready only where documented (`/v3/pdf/{id}.{ext}` with a
  non-completed status body, `/files/v1/{id}.{ext}` with `format_not_ready`); converter 404s and all other 404s throw.
- Uncovered operations are the ones in the endpoint families above: multipart upload, the SSE stream, `/v3/batch`,
  `/v3/latex`, data sources and webhooks (plain REST data-source and webhook management could be added later).
- The icon is the corner-bracket and X mark from Mathpix's official brand SVG
  (https://mathpix.com/images/brand/mathpix-logo-lime.svg), cropped from the wordmark.
