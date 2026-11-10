# Dify

Run Dify apps and manage knowledge bases through the Dify Service API: chat, completion and workflow runs, conversations, messages, annotations, datasets, documents, segments, metadata and files (82 tools).

**Interface:** OpenAPI, from Dify's official docs repository: https://raw.githubusercontent.com/langgenius/dify-docs/main/en/api-reference/openapi_service.json. Requests go to `https://api.dify.ai/v1` (Dify Cloud). Mutations require approval.

**Auth:** API key (`Authorization: Bearer`). Create one in Dify: open an app, then API Access, then API Key for app endpoints; open Knowledge, then API Access, then API Key for knowledge base endpoints. Dify keys are scoped to one app or knowledge base, so add one account per app or knowledge base. Dify has no user-created OAuth apps for this API.

**Gaps:** Self-hosted Dify instances are not supported (the base URL is fixed to Dify Cloud). Streaming responses are not streamed: the run endpoints (chat-messages, completion-messages, workflows/run, workflows/{id}/run, pipeline/run) are exposed in their JSON form, so pass `response_mode: "blocking"`. The two stream-only endpoints (`GET /workflow/{id}/events`, pipeline datasource node run) return the whole event stream as buffered text. To make the compiler accept these, the package patches the spec to drop the `text/event-stream` response alternative. Health check calls `/info` (app keys) and falls back to `/datasets?limit=1` (knowledge-base keys); a key is reported rejected only if both return 401.
