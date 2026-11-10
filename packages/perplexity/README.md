# Perplexity

Covers the Perplexity API platform: Sonar chat completions (sync and async), Search, embeddings, the Agent API, skills, model listing and Computer usage analytics.

Interface: OpenAPI, from Perplexity's official document at https://docs.perplexity.ai/openapi.json (host `api.perplexity.ai`).

Auth: API key only. Create one in the Perplexity API console (Settings > API Groups > API Keys) and paste it when connecting; it is sent as a bearer token. Perplexity offers no user-created OAuth apps for this API.

Known gaps: the separate Perplexity Computer MCP server (OAuth) is not mounted. Every POST/PUT/DELETE operation requires approval, including Sonar and Search calls, since they consume credits. Streaming (`stream: true`, SSE) is not supported: the SSE variant of the response is removed from the spec by a patch so that the JSON response mounts. `POST /v1/agent` (create agent response) is mounted for non-streaming use only; use `background: true` and poll the retrieve tool for long runs.
