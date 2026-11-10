# VLM Run

Visual AI for documents, images, video and audio: the OpenAI-compatible chat endpoint, agents and executions, skills, predictions, files, schema/domain hub, media generation, feedback and evaluations, plus the gateway's embeddings, audio transcription, model and completion lookup and typesafe endpoints.

Interface: OpenAPI, loaded live from VLM Run's two official documents, mounted under one provider:

- `api`: https://api.vlm.run/openapi.json (45 paths on https://api.vlm.run).
- `gateway`: https://gateway.vlm.run/openapi.json ("VLM Run Gateway API", 6 tools on https://gateway.vlm.run). The gateway document's three paths that the main API already has (`/v1/openai/chat/completions`, `/v1/openai/models`, `/health`) are removed so tools are not duplicated, and its `localhost:8001` server entry is ignored.

Auth: API key only (bearer token, sent to api.vlm.run and gateway.vlm.run). Create one in the VLM Run app at https://app.vlm.run under Settings -> API keys (https://app.vlm.run/dashboard/settings/api-keys). VLM Run does not offer user-created OAuth apps for the REST APIs. The health check lists models with the key.

Known gaps: file upload endpoints that take multipart bodies depend on the framework's multipart support; use presigned URLs (`/v1/files/presigned-url`) for large files. The gateway's remote MCP server (https://gateway.vlm.run/mcp, docs at https://docs.vlm.run/gateway/mcp-server) is not mounted: its tools (`read_document`, `read_image`, `read_audio`, `read_video`, `list_models`, `get_model_info`, `get_completion`) wrap the chat completions and model/completion endpoints already available here. `scripts/tools.ts` counts only the `api` spec; the gateway adds 6 tools (3 mutations).
