# PDF Vector

Parse documents to markdown, extract structured JSON with a schema, and ask questions about documents, identity documents, invoices and bank statements (`parse`, `extract`, `ask` for each). Also search academic papers across providers, fetch papers by ID, find citations, walk a paper's citation graph, find similar papers, parse papers and search grants.

## Interface

OpenAPI, 19 operations, from the official reference at https://global.pdfvector.com/api/reference. Deliberate exception to the "stable public spec URL" rule: PDF Vector serves its official OpenAPI 3.1.1 document (version 0.4.15) only inline, in the Scalar config embedded in https://global.pdfvector.com/api/reference. `/api/reference/openapi.json`, `/openapi.json` and `/api/openapi.json` all return 404. The vendored `openapi.json` matches that embedded document (19 operations); re-extract it from the page's Scalar config to update. The official remote MCP server (https://global.pdfvector.com/mcp) exposes only read-documents, find-papers and send-files, a smaller surface, so OpenAPI is used.

## Auth

API key (`apiKey`), sent as a Bearer token. Create one after signing in at https://app.pdfvector.com. No user-created OAuth app is offered (the vendor's MCP endpoint uses vendor-managed OAuth), so apiKey is the only method.

Health check exception: the spec contains only 19 billable POST operations and the vendor documents no account, usage or credits endpoint, so there is no read-only endpoint to probe. The provider deliberately has no `health`; adding one would call a billable parse/ask operation.

## Gaps

Files are passed by URL or base64 in the request body; large base64 inputs are limited by the tool call size. Every operation is a POST, and all are approval-gated.
