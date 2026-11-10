# PDF-API.io

Covers PDF-API.io's template-based PDF generation: list templates, read a template's variables, render a PDF from a template and data, and merge several templates into one PDF.

Interface: hand-written tools over the REST API at `https://pdf-api.io/api`, from the official docs at https://pdf-api.io/en/docs. PDF-API.io publishes no OpenAPI document and no MCP server (checked the docs site and integrations.sh), so this is custom. Four tools.

Auth: API token (`apiKey`, sent as `Authorization: Bearer`). Create it in the PDF-API.io dashboard under "API Tokens" ("Create a token"); the token is shown once. The API has no OAuth.

Icon: the official logo (`https://pdf-api.io/images/logo.png`, 800px), which includes the wordmark since the vendor publishes no separate mark.

Known gaps: templates, webhooks and team settings are managed in the web UI only; the public API has no endpoints for them. Rendering returns base64 JSON or a 15-minute URL, never raw binary.
