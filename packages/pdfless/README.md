# Pdfless

Generate PDF documents from Pdfless HTML/CSS templates merged with JSON data (1 tool: `generatePdf`).

## Interface

Hand-written tool over the REST API at `https://api.pdfless.com/v1`, documented at https://docs.pdfless.com/pdfs. Pdfless publishes no OpenAPI document, GraphQL API or MCP server. Its public API reference documents a single operation, `POST /v1/pdfs`, so that is the only tool; it requires approval.

## Auth

- API key: sent in the `apikey` header. Sign in at https://app.pdfless.com, open "Workspace settings" and copy the key from "API credentials". Pdfless does not offer OAuth.
- There is no health check because Pdfless documents no read-only account endpoint.

## Known gaps

- Templates, workspaces and usage are managed in the dashboard; no API endpoints are documented for them.
- The icon is the official 180px app icon (apple-touch-icon) from pdfless.com; Pdfless publishes no SVG mark.
