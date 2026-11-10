# Eledo PDF

Generate PDF documents from Eledo templates and structured JSON data: list templates, read a template's input schema, generate a PDF directly, or use the asynchronous create-file and download flow, plus an account profile check. Six hand-written tools: `profile`, `listTemplates`, `getTemplateSchema`, `generateDocument`, `createFile`, `downloadFile`. PDFs are returned as base64 with their filename.

**Interface:** custom `fetch` tools over Eledo's REST API v1 (`https://eledo.online/api/RESTv1/`), documented at https://eledo.online/documentation/api_reference. Eledo publishes no OpenAPI document, MCP server or GraphQL API.

**Auth:** API key. In Eledo, open Integrations > API from the top menu and copy the API key. It is sent in the `Api-Key` header to `eledo.online`. Eledo offers no OAuth.

**Gaps:** templates are created and edited in Eledo's web editor only; the API cannot create or modify them. Generation and file creation require approval.
