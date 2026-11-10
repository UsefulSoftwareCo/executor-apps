# PDFMonkey

Generate PDFs and images from templates with PDFMonkey: create, poll, update and delete documents, read document cards and download URLs, and manage templates (14 tools).

## Interface

Hand-written tools over the REST API at `https://api.pdfmonkey.io/api/v1`, documented at https://pdfmonkey.io/docs/api/. PDFMonkey publishes no OpenAPI document, GraphQL API or MCP server, so each operation in the Documents and Templates API references is a `fetch` tool. Mutations require approval.

## Auth

- API key: the account's secret key, sent as a Bearer token. Find it on the API Key page, reachable from the sidebar of the PDFMonkey dashboard. PDFMonkey does not offer OAuth. The health check calls `GET /current_user`.

## Known gaps

- Webhook management, folders and workspaces are not exposed by the public API reference, so there are no tools for them.
- `listTemplates` needs a workspace id, which the API does not provide a way to list; copy it from the dashboard or from a template's `app_id`.
- The icon is the official app icon from pdfmonkey.io (an SVG wrapping a raster image).
- `auth_token` fields are removed from every response, and `getCurrentUser` returns only an allowlist of account fields, because the field may carry the secret API key.
