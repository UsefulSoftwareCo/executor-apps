# ActiveMerge

Template-based document generation (DOCX/PPTX to PDF or original format), image generation, document merging, multi-template workflows, e-signature requests and cloud file storage with [ActiveMerge](https://activemerge.com).

**Interface:** OpenAPI. ActiveMerge's own OpenAPI 3 document (the one behind its Swagger UI at https://app.activemerge.com/api/documentation) is read live from https://app.activemerge.com/docs. 23 operations, 7 of them mutations (all require approval). Requests go to `https://app.activemerge.com`; the docs also mention `api.activemerge.com`, which does not resolve, so the spec host is used.

**Auth:** API key only. ActiveMerge has no OAuth. Create a key at https://app.activemerge.com/api-access; it is shown once. It is sent in the `API-KEY` header.

**Icon:** the AM mark cropped from the official logo SVG at https://app.activemerge.com/images/ActiveMerge-logo.svg.

**Known gaps:**
- Seven operations have hash-valued operationIds in the vendor spec (files list/save/download, templates list/placeholders, workflows list/placeholders). They are renamed with spec patches (`files.listFiles`, `files.saveFile`, `files.getFileDownloadUrl`, `templates.listTemplates`, `templates.getTemplatePlaceholders`, `workflows.listWorkflows`, `workflows.getWorkflowPlaceholders`) so tool names stay stable when the vendor regenerates the spec.
- E-signatures and cloud storage need paid plans. Generation consumes credits.
- ActiveMerge also offers an official remote MCP server at https://app.activemerge.com/mcp (OAuth with dynamic registration). Its tool list requires an account and was not inspected, so it is not compared with the OpenAPI interface. This package does not offer the MCP's OAuth path; it uses the API key only.
