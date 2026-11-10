# Nanonets

Extract fields and tables from invoices, receipts, passports and other documents with Nanonets OCR models. Covers synchronous and asynchronous predictions from URLs or uploaded files, reading back prediction results (by file, by page, or by date range), training models with training images, image classification, and external integrations (list and run queries).

## Interface

Custom hand-written tools over the Nanonets v2 REST API (`https://app.nanonets.com/api/v2`). Nanonets does not publish a downloadable OpenAPI document; the operations come from the per-endpoint reference at https://docs.nanonets.com/reference/overview (sourced from the OpenAPI definitions embedded in those pages). Uploaded files are passed as base64 strings.

## Auth

API key (`apiKey`). Create one in the Nanonets app under Account Info, then API Keys, "Add a New Key" (https://app.nanonets.com/#keys). The key is sent as HTTP Basic auth with the key as username and an empty password. There is no user-creatable OAuth app.

## Known gaps

- The newer v4 Workflows API (`/api/v4/workflows/...`) is not covered; only the documented v2 endpoints are.
- There is no tool to list models: the vendor reference documents no list-models endpoint (`GET /OCR/Model/` is undocumented), so the health check uses the documented `GET /externalIntegrations`. Take model ids from the Nanonets app.
- Not verified: whether Nanonets publishes an official remote MCP server (none found in its docs or llms.txt), and whether the v4 Workflows API is public (llms.txt lists no v4 pages).
- integrations.sh has no Nanonets record; spec and auth (API key) were checked against the vendor docs.
- File upload tools take base64 content, so very large documents are impractical.
- Webhook, export and approval configuration live in the Nanonets app; the file review, assign, export and delete via API guides are prose-only and not exposed.
