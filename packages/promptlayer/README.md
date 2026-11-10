# PromptLayer

Prompt management and LLM observability: prompt templates and labels, request logs and search, traces, datasets, evaluations, tables and sheets, folders, environment variables, skill collections and the tool registry.

Interface: OpenAPI, from the vendor's own document at https://docs.promptlayer.com/openapi.json (143 tools; the 93 POST/PUT/PATCH/DELETE operations, including some read-only POST queries such as request-log search and analytics, require approval). The document declares no servers, so the API origin `https://api.promptlayer.com` is set in `openapi.ts`.

Auth: API key only. Create one on the API keys page of the PromptLayer dashboard; it is sent as the `X-API-KEY` header. PromptLayer does not offer user-created OAuth apps.

Known gaps: the vendor also runs an authenticated workspace MCP server (`https://mcp.promptlayer.com/mcp`); its tool set was not inspected (it needs a real PromptLayer account to list tools) so it is not mounted; the REST API is the only interface here. Multipart file-upload operations may be limited by the OpenAPI tool generator.
